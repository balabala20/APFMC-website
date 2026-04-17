const Alert = require('../models/Alert');
const pushService = require('../services/pushService');

// Define thresholds
const THRESHOLDS = {
  CURRENT_CRITICAL: 2,      // Disable loads if current > 2A
  CURRENT_NORMAL: 1.5,       // Re-enable loads if current < 1.5A (hysteresis)
  VOLTAGE_CRITICAL: 260,     // Disable loads if voltage > 260V
  VOLTAGE_NORMAL: 240        // Re-enable loads if voltage < 240V (hysteresis)
};

async function checkProtection(payload, io) {
  const alerts = [];
  let criticalDetected = false;
  
  // Check for critical conditions
  if (payload.current && payload.current > THRESHOLDS.CURRENT_CRITICAL) {
    const a = await Alert.create({ type: 'overcurrent', message: 'Overcurrent detected', data: payload, severity: 'critical' });
    alerts.push(a);
    io && io.emit('alert', a);
    criticalDetected = true;
    try { await pushService.broadcast(null, { title: 'Overcurrent Alert', body: `Current ${payload.current}A exceeds threshold` }); } catch(e){ console.error(e); }
  }
  if (payload.voltage && payload.voltage > THRESHOLDS.VOLTAGE_CRITICAL) {
    const a = await Alert.create({ type: 'overvoltage', message: 'Overvoltage detected', data: payload, severity: 'critical' });
    alerts.push(a);
    io && io.emit('alert', a);
    criticalDetected = true;
    try { await pushService.broadcast(null, { title: 'Overvoltage Alert', body: `Voltage ${payload.voltage}V exceeds threshold` }); } catch(e){ console.error(e); }
  }

  if (criticalDetected) {
    // disable loads and save state
    try {
      const LoadControl = require('../models/LoadControl');
      const rec = await LoadControl.create({ load1: false, load2: false, disabled: true, disableReason: 'Protection tripped due to critical condition', note: JSON.stringify(payload) });
      io && io.emit('control-disabled', rec);
      io && io.emit('system-status', { status: 'critical', reason: rec.disableReason });
    } catch (e) {
      console.error('Failed to disable loads', e.message);
    }
  } else {
    // Check if conditions are normal and system is currently disabled
    const LoadControl = require('../models/LoadControl');
    const lastControl = await LoadControl.findOne().sort({ createdAt: -1 });
    
    // Re-enable if disabled AND conditions are normal
    if (lastControl && lastControl.disabled) {
      const conditionsNormal = 
        (!payload.current || payload.current <= THRESHOLDS.CURRENT_NORMAL) &&
        (!payload.voltage || payload.voltage <= THRESHOLDS.VOLTAGE_NORMAL);
      
      if (conditionsNormal) {
        try {
          const rec = await LoadControl.create({ 
            load1: false, 
            load2: false, 
            capacitor: true,
            disabled: false, 
            disableReason: 'System recovered - conditions normal', 
            note: JSON.stringify(payload) 
          });
          io && io.emit('control-enabled', rec);
          io && io.emit('system-status', { status: 'normal', message: 'System recovered - loads can be controlled' });
          
          // Create alert for recovery
          try { 
            await pushService.broadcast(null, { title: 'System Recovered', body: 'Power conditions returned to normal' }); 
          } catch(e){ console.error(e); }
        } catch (e) {
          console.error('Failed to re-enable loads', e.message);
        }
      }
    }
  }
  return alerts;
}

module.exports = { checkProtection };

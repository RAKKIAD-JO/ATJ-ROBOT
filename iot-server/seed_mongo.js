const mongoose = require('mongoose');
const Esp32Status = require('./models/esp32status');
const Esp32Data = require('./models/esp32data');
const Esp32Sensor = require('./models/esp32sensor');

// Connect to MongoDB via localhost port mapped by Docker
const mongoUrl = 'mongodb://localhost:27017/esp32_db';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB successfully!');

    // 1. Clear old data
    console.log('Clearing old MongoDB collections...');
    await Esp32Status.deleteMany({});
    await Esp32Data.deleteMany({});
    await Esp32Sensor.deleteMany({});
    console.log('Cleared successfully.');

    // 2. Insert Device Statuses matching PostgreSQL database tokens
    const devices = [
      {
        device_id: 'device_sim_01',
        token: 'a0e35b9ae11f3e1840916e',
        status: 'online',
        last_update: new Date()
      },
      {
        device_id: 'ATJ001',
        token: '7a36ba35e3e78a2754a27b',
        status: 'online',
        last_update: new Date()
      }
    ];

    await Esp32Status.insertMany(devices);
    console.log('Inserted devices status mappings.');

    // 3. Generate Historical Data over the last 7 days
    const crops = ['ข้าว', 'ข้าวโพด', 'มันสำปะหลัง', 'อ้อย'];
    const liquids = ['น้ำ', 'ปุ๋ย', 'สารเคมี'];
    const chemicals = {
      'น้ำ': 'ไม่มี',
      'ปุ๋ย': 'ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต',
      'สารเคมี': 'ยาฆ่าแมลงชีวภาพ ไบโอแม็กซ์'
    };
    const areas = ['แปลง A1 (ทิศเหนือ)', 'แปลง B2 (ริมห้วย)', 'แปลง C3 (ที่ลุ่ม)', 'โซนสาธิตเกษตรกร'];

    const numDays = 7;
    const now = new Date();

    console.log(`Generating historical telemetry and operations for the last ${numDays} days...`);

    let dataCount = 0;
    let sensorCount = 0;

    for (let dayOffset = numDays - 1; dayOffset >= 0; dayOffset--) {
      // Base date for this day
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - dayOffset);
      
      // Perform 1 to 2 operations per day per device
      for (const device of devices) {
        const numOps = Math.floor(Math.random() * 2) + 1; // 1 or 2 operations

        for (let opIdx = 0; opIdx < numOps; opIdx++) {
          // Set timestamp for this operation (e.g. morning/afternoon)
          const opTime = new Date(targetDate);
          opTime.setHours(opIdx === 0 ? 8 + Math.floor(Math.random() * 3) : 15 + Math.floor(Math.random() * 3));
          opTime.setMinutes(Math.floor(Math.random() * 60));
          opTime.setSeconds(0);

          const formID = `form_${device.device_id}_${dayOffset}_${opIdx}`;
          const plantType = crops[Math.floor(Math.random() * crops.length)];
          const liquidType = liquids[Math.floor(Math.random() * liquids.length)];
          const chemicalName = chemicals[liquidType];
          const area = areas[Math.floor(Math.random() * areas.length)];
          const other = `รอบพ่นทดสอบที่ ${opIdx + 1} ประจำวัน`;

          // A. Insert operational metadata (Esp32Data)
          const operation = new Esp32Data({
            formID,
            device_id: device.device_id,
            plantType,
            liquidType,
            chemicalName,
            area,
            other,
            timestamp: opTime
          });
          await operation.save();
          dataCount++;

          // B. Insert sensor telemetry logs (Esp32Sensor)
          // 15 telemetry logs spacing every 1 minute
          let battery = 100;
          let waterLevel = 100;
          let totalVolume = 0;

          for (let tick = 0; tick < 15; tick++) {
            const tickTime = new Date(opTime);
            tickTime.setMinutes(opTime.getMinutes() + tick);

            battery = Math.max(15, battery - (Math.random() * 1.2 + 0.3));
            const flowRate = parseFloat((Math.random() * 1.5 + 2.0).toFixed(2)); // 2.0 - 3.5 L/min
            // Consume water
            waterLevel = Math.max(5, waterLevel - (flowRate * 0.8));
            totalVolume += parseFloat((flowRate / 10).toFixed(2));

            const sensorLog = new Esp32Sensor({
              formID,
              device_id: device.device_id,
              battery: Math.round(battery),
              pumpStatus: 'ON',
              sprayRate: Math.floor(Math.random() * 6) + 90, // 90-95%
              flowRate,
              waterLevel: Math.round(waterLevel),
              liquidType: liquidType === 'น้ำ' ? 'water' : (liquidType === 'ปุ๋ย' ? 'fertilizer' : 'pesticide'),
              totalVolume: parseFloat(totalVolume.toFixed(2)),
              timestamp: tickTime
            });

            await sensorLog.save();
            sensorCount++;
          }
        }
      }
    }

    console.log('Seeding completed successfully!');
    console.log(`- Created ${devices.length} device status records.`);
    console.log(`- Created ${dataCount} historical spraying operation logs.`);
    console.log(`- Created ${sensorCount} telemetry sensor reports.`);

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();

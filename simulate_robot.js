const http = require('http');

const DEVICE_ID = 'device_sim_01';
const ROBOT_NAME = 'Simulated Robot';
const IOT_SERVER_PORT = 3000;
const IOT_SERVER_HOST = 'localhost';

function post(path, headers, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: IOT_SERVER_HOST,
            port: IOT_SERVER_PORT,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => { resData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(resData ? JSON.parse(resData) : {});
                    } catch (e) {
                        resolve(resData);
                    }
                } else {
                    reject(new Error(`Status Code: ${res.statusCode}. Response: ${resData}`));
                }
            });
        });

        req.on('error', (err) => { reject(err); });
        req.write(data);
        req.end();
    });
}

async function startSimulation() {
    try {
        console.log('======================================================');
        console.log('           🤖 ATJ Robot Simulator Active 🤖           ');
        console.log('======================================================');
        console.log(`Generating token for Device ID: ${DEVICE_ID}...`);
        
        // 1. Generate token
        const tokenRes = await post('/api/generate-token', {}, { device_id: DEVICE_ID });
        const token = tokenRes.token;
        console.log(`\nGenerated Token successfully: ${token}`);
        console.log('\n======================================================');
        console.log('HOW TO TEST IN WEB APP:');
        console.log('1. Go to http://localhost:4000/register to create an account.');
        console.log('2. Log in and go to the "Assign Robot" page.');
        console.log(`3. Enter Robot Token: ${token}`);
        console.log(`4. Enter Robot Name: ${ROBOT_NAME}`);
        console.log('5. Click "Assign Robot" to register it.');
        console.log('======================================================\n');

        // 2. Set device status to online
        console.log('Setting device status to online...');
        await post('/api/esp32-status', {}, {
            device_id: DEVICE_ID,
            token: token,
            status: 'online'
        });

        // 3. Send initial metadata (esp32-data)
        const formID = 'form_' + Math.floor(Math.random() * 100000);
        console.log(`Sending operation metadata (Form ID: ${formID})...`);
        await post('/api/esp32-data', { device_id: DEVICE_ID, token: token }, {
            formID,
            device_id: DEVICE_ID,
            plantType: 'ข้าว',
            liquidType: 'น้ำ',
            chemicalName: 'ไม่มี',
            area: 'แปลงข้าวทดลอง A',
            other: 'บอร์ดจำลองข้อมูลสถานะ',
            timestamp: new Date().toISOString()
        });

        // 4. Send periodic sensor data (esp32-sensor)
        let battery = 100;
        let waterLevel = 100;
        let totalVolume = 0;
        
        console.log('Starting sensor telemetry transmission (every 3 seconds). Press Ctrl+C to stop.');
        
        setInterval(async () => {
            battery = Math.max(20, battery - (Math.random() * 0.5));
            waterLevel = Math.max(10, waterLevel - (Math.random() * 1.5));
            const flowRate = (Math.random() * 2 + 1).toFixed(2);
            totalVolume += parseFloat((flowRate / 20).toFixed(2));

            try {
                await post('/api/esp32-sensor', { device_id: DEVICE_ID, token: token }, {
                    device_id: DEVICE_ID,
                    formID,
                    battery: Math.round(battery),
                    pumpStatus: 'on',
                    sprayRate: 90,
                    waterLevel: Math.round(waterLevel),
                    flowRate: parseFloat(flowRate),
                    totalVolume: parseFloat(totalVolume.toFixed(2)),
                    liquidType: 'น้ำ',
                    timestamp: new Date().toISOString()
                });
                console.log(`[Telemetry Sent] Battery: ${Math.round(battery)}%, Water Level: ${Math.round(waterLevel)}%, Flow Rate: ${flowRate} L/min, Total Vol: ${totalVolume.toFixed(2)} L`);
            } catch (err) {
                console.error('Error sending telemetry:', err.message);
            }
        }, 3000);

    } catch (err) {
        console.error('Error in simulation startup:', err.message);
    }
}

startSimulation();

# 🤖 ATJ-ROBOT (ATJ Web Server & IoT Management Platform)

![CI Workflow](https://github.com/RAKKIAD-JO/ATJ-ROBOT/actions/workflows/ci.yml/badge.svg)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-brightgreen)](https://nodejs.org/)
[![Next.js Version](https://img.shields.io/badge/Next.js-v15-blue)](https://nextjs.org/)
[![Coverage](https://img.shields.io/badge/Unit%20Test%20Coverage-%3E80%25-success)](#-เงื่อนไขการ-commit--push-โค้ด)

ระบบแพลตฟอร์มบริหารจัดการและควบคุมหุ่นยนต์ฉีดพ่นทางการเกษตร (ATJ-ROBOT) รองรับการแสดงผลข้อมูลเรียลไทม์ วิเคราะห์ปริมาณของเหลว แยกตามหมวดหมู่ การจัดการอุปกรณ์ IoT และระบบสลับธีม (Dark / Light Mode)

---

## 📽️ สื่อและคู่มือการใช้งาน

- **คลิปวิดีโอการใช้งาน**: [YouTube Video](https://youtu.be/OE8FP5gMXAA?si=nl9vK1GNxRAZdr3e) | [Google Drive Folder](https://drive.google.com/drive/folders/1HIuyH-sl5VpFn8SXBq7AwYGl9jyG5GqU?usp=sharing)
- **คู่มือการใช้งาน**: [Google Drive Document](https://drive.google.com/file/d/1YdC862X-GtKcPSd9Y8cugBNKwZLwkpF2/view?usp=drive_link)

---

## 🛠️ Tech Stack (เทคโนโลยีที่ใช้)

### 🔹 Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS, CSS Variables (Theme Tokens: Dark / Light Mode)
- **UI & Visualization**: Recharts, Chart.js, MUI X-Charts, Animate.css, SweetAlert2, React Spinners

### 🔹 Backend API Server
- **Runtime**: Node.js & Express.js
- **Database**: PostgreSQL 15 (ผ่าน `pg` / `pg-pool`)
- **Authentication**: JWT (JSON Web Tokens) & HTTP-Only Cookies
- **File Upload & Email**: Multer (รูปโปรไฟล์), Nodemailer & Resend (ส่ง OTP / Reset Password)

### 🔹 IoT Server
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Background Jobs**: Automatic Status Checker (เปลี่ยนสถานะหุ่นยนต์เป็น Offline อัตโนมัติเมื่อขาดการเชื่อมต่อ)

### 🔹 Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **Quality Assurance**: Jest, `ts-jest`, Husky Pre-push Hook
- **Continuous Integration**: GitHub Actions CI Workflow

---

## 💻 สิ่งที่ต้องติดตั้งล่วงหน้า (Prerequisites)

ก่อนเริ่มรันโปรเจกต์ โปรดตรวจสอบว่าเครื่องของคุณติดตั้งโปรแกรมดังต่อไปนี้แล้ว:
1. **[Node.js](https://nodejs.org/)**: เวอร์ชัน `v20.x` ขึ้นไป และ `npm`
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: สำหรับรัน PostgreSQL และ MongoDB Containers
3. **[Git](https://git-scm.com/)**: สำหรับจัดการ Source Control

---

## 🚀 วิธีการติดตั้งและรันระบบ (Getting Started)

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/RAKKIAD-JO/ATJ-ROBOT.git
cd ATJ-web-server

# ติดตั้ง Dependencies สำหรับ Root และตั้งค่า Husky
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` ใน Root Directory และใน Sub-folders (`backend/` และ `iot-server/` หากจำเป็น):
```bash
cp .env.example .env
```

### 3. รัน Database Containers (Docker Compose)
เปิดใช้งาน Docker Desktop แล้วรันคำสั่งเพื่อเริ่มบริการ PostgreSQL และ MongoDB:
```bash
docker-compose up -d db mongodb
```

### 4. รันระบบทั้งหมดแบบ Development Mode
รัน Backend API, IoT Server และ Frontend Next.js พร้อมกันในคำสั่งเดียว:
```bash
npm run dev
```

ระบบจะรันบริการต่าง ๆ ดังนี้:
- **Frontend App**: `http://localhost:4000`
- **Backend API**: `http://localhost:5000`
- **IoT Server**: `http://localhost:3000`

---

## 🧪 การทดสอบและจำลองข้อมูล (Testing & Simulation)

### รัน Unit Tests ทั้งหมด
```bash
npm test
```

### จำลองการส่งข้อมูลหุ่นยนต์ IoT (Simulate Robot Data)
สามารถรัน Script จำลองการส่งค่าจากหุ่นยนต์ไปยัง IoT Server ได้ด้วยคำสั่ง:
```bash
npm run sim
```

---

## 🛑 เงื่อนไขการ Commit & Push โค้ด (Code Contribution Rules)

โปรเจกต์นี้ใช้มาตรการควบคุมคุณภาพโค้ดระดับเข้มงวด (Quality Gate) ผ่าน **Husky** และ **GitHub Actions CI**:

1. **Husky Pre-Push Hook (การตรวจสอบอัตโนมัติก่อน Push)**:
   - ทุกครั้งที่ใช้คำสั่ง `git push` ระบบ Husky จะทำการรัน `npm test` อัตโนมัติในทั้ง 3 โมดูล (`backend`, `iot-server`, และ `frontend`)
   - **ข้อกำหนด**: Unit Test ทั้งหมดต้องผ่าน 100% และมี **Code Coverage ไม่ต่ำกว่า 80%**
   - หาก Test ไม่ผ่าน หรือ Coverage ต่ำกว่า 80% ระบบจะระงับ (Block) ไม่ให้ Push ขึ้น Remote Repository โดยทันที

2. **GitHub Actions CI Workflow**:
   - เมื่อมีการสร้าง Pull Request (PR) หรือ Push เข้าแบรนช์ `main`, `master`, หรือ `dev` ระบบ GitHub CI จะทำการตรวจสอบ 3 ส่วนบน Cloud อัตโนมัติ:
     - 🧪 **Unit Tests & 80%+ Coverage Check**
     - 🔍 **TypeScript Validity & Linting Check**
     - 🏗️ **Next.js Production Build (`npm run build`)**

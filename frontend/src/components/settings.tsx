'use client';
import React, { useEffect, useRef, useState } from 'react';
import "@/styles/settings.css";
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState('/avatar.jpg');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); // ตั้งค่าเริ่มต้นได้จากระบบ
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const router = useRouter();
  useEffect(() => {
    fetch("/api/users/profile", {
      credentials: "include"
    })
      .then(res => {
        if (res.status === 403 || res.status === 401) {
          setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          // เพิ่ม redirect ไปหน้า login
          router.replace('/');
          return;
        }
        return res.json();
      })
      .then(user => {
        if (!user) return;
        const name = (user.firstName || "") + " " + (user.lastName || "");
        setProfileFullName(name);
        setProfilePhone(user.phone || "");
        setProfileEmail(user.email || "");
        setEmail(user.email || "");
        setProfileImage(user.profileImage || "/avatar.jpg");
      })
      .catch((err) => {
        setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
      });
  }, [router]);

  // เพิ่ม useEffect สำหรับ set fullName/phone แค่ครั้งแรกที่โหลด user
  useEffect(() => {
    if (profileFullName && fullName === "") setFullName(profileFullName);
    if (profilePhone && phone === "") setPhone(profilePhone);
  }, [profileFullName, profilePhone]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      if (newPassword) formData.append('newPassword', newPassword);
      if (fileInputRef.current?.files?.[0]) {
        formData.append('profileImage', fileInputRef.current.files[0]);
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (response.status === 403) {
        setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // เมื่อบันทึกสำเร็จ ให้ update ข้อมูลแสดงผล
      setProfileFullName(fullName);
      setProfilePhone(phone);
      setProfileEmail(email);

      setErrorMessage('');
      alert('อัปเดตข้อมูลสำเร็จ');
      router.push('/settings');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return (
    <main className="main-setting">
      <div className="header-setting">
        <h2>ตั้งค่าข้อมูลส่วนตัว</h2>
        <p>{today}</p>
      </div>

      <div className="card-setting">
        <div className="left-section">
          <img
            ref={imgRef}
            src={
              profileImage?.startsWith('data:') || profileImage?.startsWith('blob:')
                ? profileImage
                : profileImage?.startsWith('/uploads/profile_Image')
                  ? `${profileImage}`
                  : '/avatar.jpg'
            }
            alt="Profile"
            className="profile-img"
          />
          <h4>{profileFullName || 'ชื่อของคุณ'}</h4>
          <p>อีเมล: {profileEmail}</p>
          <p>เบอร์โทร: {profilePhone || 'ยังไม่ได้กรอกเบอร์โทร'}</p>
        </div>

        <div className="right-section">
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            อัพโหลดรูปภาพ
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            style={{ display: 'none' }}
          />

          <div className="form-group">
            <div className="column">
              <label>ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ชื่อ-นามสกุลของคุณ"
              />
            </div>
            <div className="column">
              <label>เบอร์โทร</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เบอร์โทรศัพท์ของคุณ"
              />
            </div>
            <div className="column">
              <label>รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่ของคุณ"
              />
            </div>

            <div className="column">
              <label>ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่ของคุณ"
              />          
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
            
            <div className="column">
              <label>Email</label>
              <input
                type="email"
                value={email}
                readOnly
                placeholder={email}
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <button className="save-button" onClick={handleSaveChanges}>Save Changes</button>
        </div>
      </div>
    </main>
  );
}

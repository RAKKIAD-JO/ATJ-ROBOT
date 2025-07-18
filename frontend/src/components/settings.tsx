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

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetch("/api/users/profile", {
      credentials: "include"
    })
      .then(res => {
        if (res.status === 403 || res.status === 401) {
          setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          router.replace('/');
          return;
        }
        return res.json();
      })
      .then(user => {
        if (!user) return;
        setProfileFullName(
          [user.firstName, user.lastName].filter(Boolean).join(" ")
        );
        setProfilePhone(user.phone || "");
        setProfileEmail(user.email || "");
        setProfileImage(user.profileImage || "/avatar.jpg");
        setEmail(user.email || "");
      })
      .catch((err) => {
        setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
      });
  }, [router]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    
      if (!file.type.startsWith("image/")) {
        alert("กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น");
        return;
      }

      const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension || "")) {
        alert("รองรับเฉพาะไฟล์: .jpg, .jpeg, .png, .gif, .webp");
        return;
      }
      if (file.size > 2 * (1024 * 1024)) {
        alert("ไฟล์ใหญ่เกิน 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    if (phone && phone.length !== 10) {
      setErrorMessage('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    try {
      const formData = new FormData();

      if (fullName.trim() !== profileFullName.trim() && fullName.trim() !== "") {
        formData.append('fullName', fullName.trim());
      }
      if (phone.trim() !== profilePhone.trim() && phone.trim() !== "") {
        formData.append('phone', phone.trim());
      }
      if (newPassword) {
        formData.append('newPassword', newPassword);
      }
      if (fileInputRef.current?.files?.[0]) {
        formData.append('profileImage', fileInputRef.current.files[0]);
      }

      if ([...formData.keys()].length === 0) {
        setErrorMessage('กรุณากรอกข้อมูลที่ต้องการเปลี่ยน');
        return;
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

      setErrorMessage('');
      alert('อัปเดตข้อมูลสำเร็จ');
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      router.replace('/settings');
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) setPhone(value);
                }}
                placeholder="เบอร์โทรศัพท์ของคุณ"
                maxLength={10}
              />
            </div>

            <div className="column">
              <label>รหัสผ่านใหม่</label>
              <div className="password-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="รหัสผ่านใหม่ของคุณ"
                />
                <span
                  className="material-symbols-outlined toggle-icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
            </div>

            <div className="column">
              <label>ยืนยันรหัสผ่าน</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่ของคุณ"
                />
                <span
                  className="material-symbols-outlined toggle-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
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

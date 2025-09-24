// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import "@/styles/resetPassword.css";

// interface Props {
//   email: string;
// }

// export default function ResetPassword({ email  }: Props) {
//     const router = useRouter();
//     //const searchParams = useSearchParams();
//     //const [email, setEmail] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [modalMessage, setModalMessage] = useState<string | null>(null);
//     //const email = typeof searchParams.email === "string" ? searchParams.email : "";
//     //const emailFormLink = searchParams.get("email" ) || "" ;
    
//     // useEffect ( () =>{
//     //     if(emailFormLink){
//     //         setEmail(emailFormLink);
//     //     }
//     // },[emailFormLink]);

//     const showModal = (message: string) => {
//         setModalMessage(message);
//     };

//     const closeModal = () => {
//         setModalMessage(null);
//         window.location.reload();
//     };

//     const handlerResetPassword = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (newPassword !== confirmPassword) {
//             showModal("รัหสผ่านไม่ตรงกัน");
//             return;
//         }
//         if (!email) {
//             showModal("ไม่พบอีเมล");
//             return;
//         }
//         setLoading(true);

//         try {
//             const response = await fetch("/api/users/reset-password", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ email, newPassword }),
//             });

//             const data = await response.json();
//             if (response.ok) {
//                 showModal("รีเซ็ตรหัสผ่านสำเร็จ!");
//                 router.push("/login-registers");
//             } else {
//                 showModal(data.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
//             }
//         } catch (error) {
//             console.error("เกิดข้อผิดพลาด:", error);
//             showModal("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
//         } finally {
//             setLoading(false);
//         }
//     }
//     return (
//         <div className="reset-password-container">
//             <div className="crad-reset-password">
//                 <div className="form-box-reset-password">
//                     <h2>Reset Password</h2>

//                     <form onSubmit={handlerResetPassword}>
//                         <input type="email" placeholder="Email" value={email} readOnly />
//                         <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
//                         <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
//                         <button type="submit" disabled={loading}>
//                             {loading ? "กำลังรีเซ็ตรหัสผ่าน..." : "Reset Password"}
//                         </button>
//                     </form>

//                     <p className="back-to-login" onClick={() => router.push("/login-registers")}>
//                         Back to Login
//                     </p>
//                 </div>
//                 <div className="image-box">
//                     <h1>welcome ATJ robot</h1>
//                     <img src="/logomine1.png" alt="Login" />
//                 </div>
//             </div>
//             {modalMessage && (
//                 <div className="modal-overlay">
//                 <div className="modal-box">
//                     <button className="modal-close" onClick={closeModal}>×</button>
//                     <div className="checkmark-animation">
//                     <svg viewBox="0 0 52 52" className="checkmark">
//                         <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
//                         <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16" />
//                     </svg>
//                     </div>
//                     <p>{modalMessage}</p>
//                     <button className="modal-ok" onClick={closeModal}>ตกลง</button>
//                 </div>
//                 </div>
//             )}
//         </div>
//     )
// }


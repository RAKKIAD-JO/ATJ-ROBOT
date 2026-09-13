export default function Spraying() {
    return (
        <main className="w-full md:w-[calc(100%-16rem)] md:ml-64 p-4 md:p-8 mt-2">
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        <span className="text-[#17a2b8]">หุ่</span>นยนต์ฉีดพ่นสำหรับการ
                    </h2>
                    <p className="text-sm text-gray-500">เกษตรกรขนาดเล็ก</p>
                </div>
                <div>
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <div className="text-base font-bold text-[#17a2b8] mb-4">
                            แสดงสถานะการฉีดพ่น
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 shrink-0">
                                <img src="/spray.png" alt="Spray" className="w-full h-full object-contain" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-sm text-gray-700">
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-gray-800">ชนิดพืช :</span> -</p>
                                    <p><span className="font-semibold text-gray-800">ประเภทของเหลว :</span> -</p>
                                    <p><span className="font-semibold text-gray-800">ชื่อสารเคมี :</span> -</p>
                                </div>
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-gray-800">พื้นที่ :</span> -</p>
                                    <p><span className="font-semibold text-gray-800">ระยะเวลา :</span> -</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 left-8">
        <h2 className="text-2xl font-extrabold text-gray-800">
          ATJ <span className="text-[#17a2b8]">Robot</span>
        </h2>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-slate-200/80 flex flex-col md:flex-row items-center gap-8 mt-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight">
            หุ่นยนต์ฉีดพ่นเพื่อการเกษตร
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            ลดการสัมผัสสารเคมีโดยตรง ช่วยลดความเสี่ยงต่อสุขภาพของเกษตรกร
          </p>
          <div>
            <Link href="/login-registers">
              <button className="px-8 py-3 bg-[#17a2b8] hover:bg-[#138496] text-white font-bold rounded-2xl text-base transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                Login
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="/logomine1.png"
            alt="Agriculture Robot"
            className="w-64 h-64 md:w-80 md:h-80 object-contain animate-pulse"
          />
        </div>
      </div>
    </div>
  );
}
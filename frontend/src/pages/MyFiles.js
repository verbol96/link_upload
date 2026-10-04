import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";

const MyFiles = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />

            <div className="flex-1 w-full max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-6">


                {/* Заглушка */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <span className="absolute inset-2 rounded-full bg-teal-900/10"></span>
                        <span className="absolute inset-0 flex items-center justify-center">
                            <i className="bi bi-images text-2xl text-teal-800"></i>
                        </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                        Раздел в разработке
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                        Здесь вы сможете загружать фото частями, с разных устройств
                        и в течение нескольких дней — перед отправкой заказа на печать.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default MyFiles;
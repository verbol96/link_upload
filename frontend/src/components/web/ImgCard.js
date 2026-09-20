export const ImgCard = ({ image, deleteImg }) => {
    // Шахматный паттерн через градиенты CSS
const checkerboard = {
    backgroundColor: '#ffffff',   // почти белый фон
    backgroundImage: `
        linear-gradient(45deg, #f7f7f7 25%, transparent 25%),
        linear-gradient(-45deg, #f7f7f7 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f7f7f7 75%),
        linear-gradient(-45deg, transparent 75%, #f7f7f7 75%)
    `,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
};

    return (
        <div className="w-[calc(100%/3-4px)] h-[calc(33vw-30px)]
                        md:w-[calc(100%/8-10px)] md:h-[calc(12.5vw-40px)]
                        overflow-hidden relative rounded-[5px]
                        border border-[#ccc]
                        shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]
                        flex flex-col bg-transparent">

            <div className="w-full h-0 pb-[100%] relative" style={checkerboard}>
                <img
                    className="absolute top-0 left-0 w-full h-full object-contain
                            transition-opacity duration-300"
                    src={image.url}
                    alt="Card top"
                />

                <button
    className="absolute top-0 right-0 z-10
            w-6 h-6 rounded-full
            bg-white/70 m-1 hover:bg-white
            flex items-center justify-center
            transition-transform hover:scale-110
            shadow-sm
            border-0 p-0 outline-none
            focus-visible:ring-2 focus-visible:ring-[#5a7163]/40"
    onClick={() => deleteImg(image.id)}
    aria-label="Удалить фото"
>
    <i className="bi bi-x-lg text-[#5a7163] text-[12px]"></i>
</button>
            </div>
        </div>
    );
};
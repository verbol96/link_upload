import InputMask from 'react-input-mask';

export const ContactForm = ({ FIO, setFIO, phone, setPhone, typePost, setTypePost, city, setCity,
    adress, setAdress, postCode, setPostCode, other, setOther, isValid, isHolst, calcDelivery }) => {

    // Общий стиль label — «висит» на границе поля
    const labelCls = "absolute top-0 left-0 px-[5px] -translate-y-1/2 " +
        "font-normal text-[0.8rem] text-[#2D4B52] pointer-events-none";

    // Инпут: нижняя граница, тень, центр текста
    const inputCls = "outline-none text-[0.9rem] px-2 py-2 " +
        "border-0 border-b-2 border-[#2C3531] rounded-[3px] " +
        "text-center w-full h-[35px] " +
        "shadow-[0_3px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]";

    return (
        <div className="bg-white rounded-[5px] px-[10px] py-5 md:p-5
                        shadow-[0px_0px_6px_1px_rgba(61,96,94,0.38)]
                        mt-3 md:my-5">

            <div>
                <h4 className="font-light text-[16px] md:text-[20px] p-[5px] pb-[25px] pt-0 text-[#2C3531] my-[10px] md:my-0">
                    <i className="bi bi-2-square text-black mr-[10px]"></i>
                    Данные для отправки
                </h4>
            </div>

            {/* === Ряд 1: Телефон + ФИО === */}
            <div className="flex flex-col md:flex-row gap-[5px] mt-4 md:px-5">
                <div className="flex-1 relative">
                    <label className={labelCls}>Телефон:</label>
                    <InputMask
                        value={phone}
                        mask="+375 (99) 999-99-99"
                        maskChar={''}
                        className={inputCls}
                        style={{ border: isValid && '2px solid red' }}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div className="flex-1 relative">
                    <label className={labelCls}>ФИО:</label>
                    <input
                        className={inputCls}
                        value={FIO}
                        onChange={(e) => setFIO(e.target.value)}
                    />
                </div>
            </div>

            {/* === Ряд 2: Тип отправки, индекс, город, адрес === */}
            <div className="flex flex-col md:flex-row gap-[10px] mt-4 md:px-5">

                {/* Тип отправки — flex 3 */}
                <div className="relative md:mr-[8vw] w-[90%] md:w-auto mx-auto md:mx-0 md:flex-[3]">
                    <label className={labelCls}>Тип отправки:</label>
                    <select
                        className="text-[0.9rem] px-2 py-2 border-0 border-b-[1.5px] border-[#2C3531]
                                text-center min-w-[200px] w-full h-[35px] outline-none
                                transition-colors
                                appearance-none bg-white text-black
                                shadow-[0_3px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]"
                        value={typePost}
                        onChange={(e) => setTypePost(e.target.value)}
                    >
                        <option value={'E1'}>Европочта(оплата ЕРИП) ~ {calcDelivery('E1')}р</option>
                        <option value={'E'}>Европочта(наложенный) ~ {calcDelivery('E')}р</option>
                        {!isHolst() && <option value={'R1'}>Письмо(оплата ЕРИП) ~ {calcDelivery('R1')}р</option>}
                        {isHolst() && <option value={'R2'}>Белпочта(оплата ЕРИП) ~ {calcDelivery('R1')}р</option>}
                        <option value={'R'}>Белпочта(наложенный) ~ {calcDelivery('R')}р</option>
                    </select>
                    <span className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
                </div>

                {/* Индекс — flex 1, показывается условно */}
                {(typePost === 'R' || typePost === 'R1') && (
                    <div className="flex-1 relative">
                        <label className={labelCls}>Индекс:</label>
                        <input
                            className={inputCls}
                            value={postCode}
                            onChange={(e) => setPostCode(e.target.value)}
                        />
                    </div>
                )}

                {/* Город — flex 2 */}
                <div className="md:flex-[2] relative">
                    <label className={labelCls}>Город:</label>
                    <input
                        className={inputCls}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>

                {/* Адрес — flex 5 */}
                <div className="md:flex-[5] relative">
                    <label className={labelCls}>
                        {(typePost === 'R' || typePost === 'R1')
                            ? 'Улица, дом, квартира:'
                            : 'Номер отделения либо его адрес:'}
                    </label>
                    <input
                        className={inputCls}
                        value={adress}
                        onChange={(e) => setAdress(e.target.value)}
                    />
                </div>
            </div>

            {/* === Ряд 3: Примечания === */}
            <div className="flex flex-col md:flex-row gap-[10px] mt-12 md:px-5">
                <div className="flex-1 relative">
                    <label className={labelCls}>Примечания:</label>
                    <textarea
                        className="text-[1rem] px-2 py-2 border-0 border-b-[1.5px] border-[#2C3531]
                                rounded-[3px] w-full md:w-1/2 outline-none
                                transition-colors
                                shadow-[0_3px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]"
                        rows={2}
                        value={other}
                        onChange={(e) => setOther(e.target.value)}
                    ></textarea>
                </div>
            </div>
        </div>
    );
};
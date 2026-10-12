import InputMask from 'react-input-mask';

export const ContactForm = ({
    FIO, setFIO,
    phone, setPhone,
    typePost, setTypePost,
    city, setCity,
    adress, setAdress,
    postCode, setPostCode,
    other, setOther,
    isValid, isHolst, calcDelivery, oblast, setOblast
}) => {
    const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[16px] md:text-[13px] font-normal text-slate-800 outline-none placeholder:text-slate-300 focus:border-[#19766d] focus:ring-2 focus:ring-[#19766d]/10 transition";
    const labelCls = "block mb-1 text-[10.5px] md:text-[11px] font-semibold text-slate-500";
    const selectCls = "w-full h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[16px] md:text-[13px] font-normal text-slate-700 outline-none appearance-none focus:border-[#19766d] focus:ring-2 focus:ring-[#19766d]/10 transition";

    const isPost = typePost === 'R' || typePost === 'R1' || typePost === 'R2';

    return (
        <div className="w-full p-2 mt-2">
            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.4fr] gap-3 lg:gap-8">

                {/* ===== Левая колонка: ФИО + телефон ===== */}
                <div className="flex flex-col gap-2 lg:gap-3">
                    <div>
                        <label className={labelCls}>
                            ФИО 
                        </label>
                        <input
                            className={inputCls}
                            value={FIO}
                            onChange={(e) => setFIO(e.target.value)}
                            placeholder="ФИО"
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Телефон</label>
                        <InputMask
                            value={phone}
                            mask="+375 (99) 999-99-99"
                            maskChar=""
                            autoComplete="tel"
                            inputMode="tel"
                            className={`${inputCls} ${isValid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                            onChange={(e) => setPhone(e.target.value)}
                            onBlur={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>

                {/* ===== Правая колонка: способ + адрес ===== */}
                <div className="flex flex-col gap-2 lg:gap-3">
                    <div>
                        <label className={labelCls}>Тип отправки (оплаты)</label>
                        <div className="relative">
                            <select
                                className={selectCls}
                                value={typePost}
                                onChange={(e) => setTypePost(e.target.value)}
                            >
                                <option value="E1">Европочта (ЕРИП) ~ {calcDelivery('E1')} р</option>
                                <option value="E">Европочта (наложенный) ~ {calcDelivery('E')} р</option>
                                {!isHolst() && <option value="R1">Письмо (ЕРИП) ~ {calcDelivery('R1')} р</option>}
                                {isHolst() && <option value="R2">Белпочта (ЕРИП) ~ {calcDelivery('R1')} р</option>}
                                <option value="R">Белпочта (наложенный) ~ {calcDelivery('R')} р</option>
                            </select>
                            <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* ===== Адрес ===== */}
                    
{/* ===== Адрес ===== */}
{isPost?(
    <div className="grid grid-cols-[3fr_5fr] md:grid-cols-[1fr_3fr] gap-2 lg:gap-3">
        <div>
            <label className={labelCls}>Индекс</label>
            <input
                className={inputCls}
                value={postCode}
                onChange={(e)=>setPostCode(e.target.value)}
                placeholder="220000"
                inputMode="numeric"
            />
        </div>
        <div>
            <label className={labelCls}>Область</label>
            <div className="relative">
                <select className={selectCls} value={oblast} onChange={(e)=>setOblast(e.target.value)}>
                    <option value=""></option>
                    <option value="Брестская область">Брестская область</option>
                    <option value="Витебская область">Витебская область</option>
                    <option value="Гомельская область">Гомельская область</option>
                    <option value="Гродненская область">Гродненская область</option>
                    <option value="Минская область">Минская область</option>
                    <option value="Могилёвская область">Могилёвская область</option>
                </select>
                <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"/>
            </div>
        </div>
        <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>Город</label>
            <input
                className={inputCls}
                value={city}
                onChange={(e)=>setCity(e.target.value)}
                placeholder="Город"
            />
        </div>
        <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>Улица, дом, квартира</label>
            <input
                className={inputCls}
                value={adress}
                onChange={(e)=>setAdress(e.target.value)}
                placeholder="Улица, дом, квартира"
            />
        </div>
    </div>
):(
    <div className="flex flex-col gap-2 lg:gap-3">
        <div>
            <label className={labelCls}>Город</label>
            <input
                className={inputCls}
                value={city}
                onChange={(e)=>setCity(e.target.value)}
                placeholder="Город"
            />
        </div>
        <div>
            <label className={labelCls}>Отделение или его адрес</label>
            <input
                className={inputCls}
                value={adress}
                onChange={(e)=>setAdress(e.target.value)}
                placeholder="Номер отделения или адрес"
            />
        </div>
    </div>
)}

                </div>
            </div>

            {/* ===== Примечание ===== */}
            <div className="mt-8 pt-4 border-t border-teal-800">
                <label className={labelCls}>
                    Примечание <span className="font-normal text-slate-300">· необязательно</span>
                </label>
                <textarea
                    className="w-full min-h-[104px] md:min-h-[64px] resize-y rounded-lg border border-slate-200 bg-white
                            px-3 py-2 text-[16px] md:text-[13px] font-normal text-slate-800
                            outline-none placeholder:text-slate-300
                            focus:border-[#19766d] focus:ring-2 focus:ring-[#19766d]/10 transition"
                    rows={4}
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    placeholder="Дополнительная информация к заказу"
                />
            </div>
        </div>
    );
};
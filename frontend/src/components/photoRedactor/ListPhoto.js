import { useEffect, useRef } from "react";

const ListPhoto = ({ photos, activePhoto, changePhoto }) => {
  const itemRefs = useRef([]);

useEffect(() => {
  if (activePhoto !== undefined && itemRefs.current[activePhoto]) {
    itemRefs.current[activePhoto].scrollIntoView({
      behavior: 'smooth',
      block: 'center'  // ← center вместо nearest
    });
  }
}, [activePhoto]);

  if (photos.length < 1) {
    return (
      <div className="h-full bg-slate-50 p-4 overflow-auto">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex justify-center w-full">
              <div className="h-24 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 p-4 overflow-auto border-r">
      <div className="space-y-3">
        {photos.map((el, index) => (
          <div
            key={el.id}
            ref={el => itemRefs.current[index] = el}
            className={`group relative flex justify-center w-full cursor-pointer transition-all duration-200 ${
              activePhoto === index ? 'scale-105' : 'hover:scale-102'
            }`}
            onClick={() => changePhoto(index)}
          >
            {/* Рамка-подсветка */}
            <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
              activePhoto === index 
                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50' 
                : 'group-hover:ring-1 group-hover:ring-gray-300'
            }`} />
            
            {/* Миниатюра */}
            <img
              src={el.url}
              alt={el.name}
              className={`h-24 w-24 object-cover rounded-lg shadow-md transition-all duration-200 ${
                activePhoto === index 
                  ? 'brightness-100' 
                  : 'brightness-90 group-hover:brightness-100'
              }`}
            />
            
            {/* Номер фото */}
            <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
              <span className="text-white text-xs font-medium">{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListPhoto;
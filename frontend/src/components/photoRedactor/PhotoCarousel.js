
import { useRef, useEffect } from 'react';
const PhotoCarousel = ({ photos, activePhoto, changePhoto }) => {
    const itemRefs = useRef([]);
    const initializedRef = useRef(false);
    useEffect(() => {
        const item = itemRefs.current[activePhoto];
        if (!item) return;
        item.scrollIntoView({
            behavior: initializedRef.current ? 'smooth' : 'instant',
            block: 'nearest',
            inline: 'center'
        });
        initializedRef.current = true;
    }, [activePhoto]);
    return (
        <div
            className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide py-2"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollPaddingLeft: '50%',
                scrollPaddingRight: '50%'
            }}
        >
            {photos.map((photo, index) => (
                <div
                    key={photo.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    onClick={() => changePhoto(index)}
                    className="shrink-0 cursor-pointer"
                >
                    <img
                        src={photo.thumb}
                        alt={photo.name}
                        className={`w-16 h-16 object-cover rounded-lg transition-all duration-150 ${
                            activePhoto === index
                                ? 'ring-2 ring-teal-700 scale-105'
                                : 'opacity-60'
                        }`}
                    />
                </div>
            ))}
        </div>
    );
};
export default PhotoCarousel;

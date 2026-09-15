import { useRef, useEffect } from 'react';

const PhotoCarousel = ({ photos, activePhoto, changePhoto }) => {
    const carouselRef = useRef(null);
    const itemRefs = useRef([]);

    useEffect(() => {
        if (!itemRefs.current[activePhoto]) return;

        itemRefs.current[activePhoto].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }, [activePhoto]);

    return (
        <div
            ref={carouselRef}
            className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide py-2"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollPaddingLeft: '50%',
                scrollPaddingRight: '50%',
            }}
        >
            {photos.map((photo, index) => (
                <div
                    key={photo.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    onClick={() => changePhoto(index)}
                    className="shrink-0 cursor-pointer"
                >
                    <img
                        src={photo.thumb}
                        alt={photo.name}
                        className={`w-16 h-16 object-cover rounded-lg transition-all ${
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
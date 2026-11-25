import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LeftMenu } from './LeftMenu';
import { getSectionTitle } from '../../routes/access';

export const NavBar = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    const openMenu = () => dispatch({ type: 'showLeftMenu' });
    const currentSection = getSectionTitle(location.pathname);

    return (
        <>
            <header className="w-full px-2 pt-2 md:pt-2">
                <div className="w-full bg-[#274c77] text-white rounded-xl md:rounded-xl shadow-sm">
                    <div className="px-3 md:px-8 flex h-14 items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={openMenu}
                                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15 border border-white/20 focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors"
                                aria-label="Меню"
                            >
                                <i className="bi bi-list text-[22px]" />
                            </button>
                            {currentSection && (
                                <div className="text-[15px] md:text-[20px] md:ml-10 font-thin text-white/90 truncate">
                                    {currentSection}
                                </div>
                            )}
                        </div>
                        <div
                            className="text-2xl md:text-3xl font-thin text-white cursor-pointer select-none shrink-0"
                            onClick={openMenu}
                        >
                            LINK
                        </div>
                    </div>
                </div>
            </header>
            <LeftMenu />
        </>
    );
};

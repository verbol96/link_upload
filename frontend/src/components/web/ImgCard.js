import style from './ImgCard.module.css'

export const ImgCard = ({image, deleteImg}) =>{

    return(
        <div className={style.cardFile}> 
          <div className={style.cardFileInner}>
          <img 
            className={style.cardImageTop} 
            src={image.url} 
            alt="Card top" 
          />
            <button 
              className={style.closeButton}
              onClick={() => deleteImg(image.id)}
            > 
            <i style={{color: '#3AAFA9', background: 'white', padding: 2, borderRadius: 5}} className="bi bi-x-square-fill"></i>
            </button>
          </div>
        </div>
    )
}
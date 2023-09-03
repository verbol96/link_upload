import './styleWeb.css'

export const ImgCard = ({image, deleteImg}) =>{
  

    return(
        <div className="cardFile"> 
          <div className="cardFileInner">
          <img 
            className="card-image-top" 
            src={image.imageUrl.toString()} 
            alt="Card top" 
          />
            <button
              className="closeButton"
              onClick={() => deleteImg(image)}
            > 
            <i className="bi bi-x-circle-fill" ></i>
            </button>
          </div>
        </div>
    )
}
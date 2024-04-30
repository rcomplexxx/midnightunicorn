import styles from "./reviews.module.css";
import ReviewsSaveButton from "./ReviewsSaveButton";
import { useState } from "react";
import GetDataButton from "../MagicButtons/GetDataButton";
import PageIndexButtons from "../MagicButtons/PageIndexButtons";
import ReviewsCard from "./ReviewsCard/ReviewsCard";
import SwapImageRevsButtons from "./SwapRevsWIthImagesToStart/SwapImageRevsButtons";
import SortByRating from "./SortByRating/SortByRating";
import ShuffleCommonReviews from "./ShuffleCommonReviews/ShuffleCommonReviews";

export default function Reviews({ reviews, setReviews }) {
  const [page, setPage] = useState(0);
  const [productId, setProductId] = useState();
  const [reviewsArray, setReviewsArray] = useState([]);
  const [areCommonReviews, setAreCommonReviews]= useState(false);

  
 

  const handleReviewsChange = (
    id,
    changed,
    name,
    text,
    imageNames,
    stars,
    deleted,
    swapId,
  ) => {


    if(areCommonReviews)return;
    
    let updatedReviewsArray = [...reviewsArray];
    let idAlreadyIncluded = false;
    updatedReviewsArray = updatedReviewsArray.map((r) => {
      if (r.id == id) {
        idAlreadyIncluded = true;
        return {
          id: id,
          changed: changed,
          name: name,
          text: text,
          imageNames: imageNames,
          stars: stars,
          deleted: deleted,
          swapId,
        };
      }
      return r;
    });
    if (!idAlreadyIncluded) {
      reviews.map((r, rId) => {
        if (id === rId)
          updatedReviewsArray.push({
            id: id,
            changed: changed,
            name: name,
            text: text,
            imageNames: imageNames,
            stars: stars,
            deleted: deleted,
            swapId,
          });
      });
    }

    setReviewsArray(updatedReviewsArray);
  };

  const clearAfterDataSave = () => {
    setAreCommonReviews(false);
    setReviewsArray([]);
    setPage(0);
  };

  const initializeReviewsData = (data) => {
    let newReviewsArray = [];
    for (let i = 0; i < data.length; i++) {
      newReviewsArray.push({ id: data[i].id, changed: false });
    }

    setReviewsArray(newReviewsArray);
  };

  const initializeReviewsCommonData = (data)=>{
    initializeReviewsData(data);
    setAreCommonReviews(true);
  }

  if (reviews.length === 1 && reviews[0] === "No Reviews")
    return (
      <>
        <h1>Reviews</h1>
        <div className={styles.reviewGetterDiv}>
          <label>Product id</label>
          <input
            id="product_id"
           
            value={productId}
            placeholder="Enter product id"
            onChange={(event) => {
              const inputNumber = event.target.value;
              if (!isNaN(inputNumber)) setProductId(inputNumber);
            }}
          />

          <GetDataButton
            name="Reviews"
            reqData={{ product_id: productId }}
            dataType={"get_reviews"}
            setData={setReviews}
            initializeData={initializeReviewsData}
          />

            <GetDataButton
            name="Common Reviews"
            reqData={{ product_id: productId }}
            dataType={"get_common_reviews"}
            setData={setReviews}
            initializeData={initializeReviewsCommonData}
          />
        </div>
        <p>No reviews imported.</p>
      </>
    );

  return (
    <>
      <div className={styles.titleDiv}>
        <h1>Reviews{reviews && <span> ({reviews.length})</span>}</h1>
        {reviews.length !== 0 ? (
          <>
          <ReviewsSaveButton
            dataType={areCommonReviews?"send_common_reviews":"send_reviews"}
            oldReviews={reviews}
            reviews={reviewsArray}
            setOldReviews={setReviews}
            clearAfterReviewsSave={clearAfterDataSave}
            areCommonReviews={areCommonReviews}
          />

{areCommonReviews ? <>
<span className={styles.commonReviewsWarning}>Warning! Changes will not be applied on common_reviews. Only shuffle will apply.
</span><ShuffleCommonReviews reviews={reviews}  setReviewsArray={setReviewsArray}/></>:
     <> <SortByRating reviews={reviews}  setReviewsArray={setReviewsArray} / > 
          <SwapImageRevsButtons reviews={reviews}  setReviewsArray={setReviewsArray} / > 
          </>
}
          </>
        ) : (
          <div className={styles.reviewGetterDiv}>
            <label>Product id</label>
            <input
              id="product_id"
              className={styles.reviewIdInput}
              value={productId}
              placeholder="Enter product id"
              onChange={(event) => {
                const inputNumber = parseInt(event.target.value, 10);
                if (!isNaN(inputNumber)) setProductId(inputNumber);
                if (event.target.value === "") setProductId("");
              }}
            />

            <GetDataButton
              name="Reviews"
              reqData={{ product_id: productId }}
              dataType={"get_reviews"}
              setData={setReviews}
              initializeData={initializeReviewsData}
            />
               <GetDataButton
            name="Common Reviews"
            reqData={{ product_id: productId }}
            dataType={"get_common_reviews"}
            setData={setReviews}
            initializeData={initializeReviewsCommonData}
          />
          </div>
        )}
      </div>

      {reviews.length !== 0 && reviews.length >= page * 10 && (
        <>
         {reviews
            .slice(
              page * 10,
              (page + 1) * 10 > reviews.length - 1
                ? reviews.length 
                : (page + 1) * 10,
            )
            .map((review, index) => {
              return (
                <ReviewsCard
                  key={review.id}
                  index={page * 10 + index + 1}
                  id={review.id}
                  name={review.name}
                  text={review.text}
                  stars = {review.stars}
                  productId={productId}
                  imageNames={review.imageNames}
                  handleReviewsChange={handleReviewsChange}
                  areCommonReviews={areCommonReviews}
                />
              );
            })}
        </>
      )}

      <PageIndexButtons data={reviews} page={page} setPage={setPage} />
    </>
  );
}

import React, { useEffect, useState } from "react";
import styles from "./fullscreenzoomableimage.module.css";
import { Zoom, Navigation } from "swiper/core";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/zoom";
import "swiper/css/navigation";
import Image from "next/image";

const FullScreenZoomableImage = ({
  imageIndex,
  setImageIndex,
  fullScreenChange,
  images,
}) => {
  const [navActive, setNavActive] = useState(true);
  const [navLocked, setNavLocked] = useState(false);
 
  const [zoomed, setZoomed] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [swiper, setSwiper] = useState();
  const [mouseStartingPoint, setMouseStartingPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId;
    let swipeYLock=false;
    let touchCoordinates = { x: 0, y: 0 };
    const imgDiv = document.getElementById("zoomDiv" + imageIndex);
    const fixedZoomDiv=  document.getElementById("fixedZoomDiv");
    const rgbValues = getComputedStyle(
      fixedZoomDiv
    ).backgroundColor.match(/\d+/g);

    let currX= 0;
    let currY = 0;

    const handleUserInteraction = () => {
      setNavActive(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function () {
        setNavActive(false);
      }, 3000);
    };

    const handleTouchStart = (event) => {
      touchCoordinates = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const handleTouchYMove = (event) => {
      if(swipeYLock) return;

     


      currY =
        event.changedTouches[event.changedTouches.length - 1].clientY -
        touchCoordinates.y;
        if(currY > -16 && currY < 16 ){imgDiv.style.transform = `translateY(${
           0
        }px)`;
        fixedZoomDiv.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${
          rgbValues[2]
        }, 1`;
    
        currX =
        event.changedTouches[event.changedTouches.length - 1].clientX -
        touchCoordinates.x;
        if((currX < -5) || currX > 5 ) swipeYLock=true;

        return;}
       



          setNavLocked(true);
         
        
      imgDiv.style.transform = `translateY(${
       currY 
      }px)`;
   
      
     
      
      fixedZoomDiv.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${
        rgbValues[2]
      }, ${1-Math.abs((imgDiv.getBoundingClientRect().top-48) / window.innerHeight) * 2})`;
    };



    const handleTouchInteraction = (event) => {
      imgDiv.style.transform = ``;
      swipeYLock=false;
      const lastTouch = event.changedTouches[event.changedTouches.length - 1];
      if (currY < -128 || currY > 128) fullScreenChange(imageIndex);
      else{
        setNavLocked(false);
        fixedZoomDiv.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${
          rgbValues[2]
        }, 1`;
      }
      
      if (!timeoutId) {
        if (
          Math.abs(lastTouch.clientX - touchCoordinates.x) < 16 &&
          Math.abs(lastTouch.clientY - touchCoordinates.y) < 16 &&
         event.target !== document.querySelector(`.${styles.zoomButton}`) &&  event.target !== document.querySelector(`.${styles.close_button}`)
        )
          timeoutId = setTimeout(function () {
            setNavActive((navActive) => !navActive);
            clearTimeout(timeoutId);
            timeoutId = null;
          }, 300);
      } else {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    if (matchMedia("(pointer:fine)").matches) {
      handleUserInteraction();
      window.addEventListener("mousemove", handleUserInteraction);
    }
    window.addEventListener("touchstart", handleTouchStart, true);
    window.addEventListener("touchmove", handleTouchYMove, true);

    window.addEventListener("touchend", handleTouchInteraction);

    return () => {
      if (matchMedia("(pointer:fine)").matches)
        window.removeEventListener("mousemove", handleUserInteraction);
      window.removeEventListener("touchstart", handleTouchStart, true);
      window.addEventListener("touchmove", handleTouchYMove, true);
      window.removeEventListener("touchend", handleTouchInteraction);
    };
  }, [imageIndex]);

  return (
    <>
      <div id="fixedZoomDiv" className={styles.full_screen_container}>
        {/* document.addEventListener("mousemove", handleUserInteraction);
  document.addEventListener("click", handleUserInteraction);
  document.addEventListener("touchstart", handleUserInteraction); */}
        <div className={styles.spaceController}>
          <div
            className={`${styles.closeSuiter} ${
              !navLocked && navActive ? styles.navActive : styles.navInactive
            }`}
          >
            <div className={styles.pagination}>
              {imageIndex + 1} / {swiper && swiper.slides.length}
            </div>
            <div>
              <Image
                height={0}
                width={0}
                sizes="24px"
                src={
                  zoomed
                    ? "/images/zoomOutIconAw.png"
                    : "/images/zoomIconAw.png"
                }
                alt="zoom"
                onClick={(event) => {
                  event.stopPropagation()
                  swiper.zoom.toggle();
                }}
                className={styles.zoomButton}
              />
              <Image
                height={0}
                width={0}
                sizes="24px"
                src="/images/cancelWhite.png"
                alt="cancel"
                onClick={(event) => {
                  event.stopPropagation()
                  fullScreenChange(imageIndex);
                }}
                className={styles.close_button}
              />
            </div>
          </div>

          <Image
            height={12}
            width={12}
            src="/images/greaterLess3.png"
            className={`${styles.leftArrow} ${
              matchMedia("(pointer:fine)").matches && navActive
                ? styles.navActive
                : styles.navInactive
            }`}
          ></Image>
          <Image
            height={12}
            width={12}
            src="/images/greaterLess3.png"
            className={`${styles.rightArrow} ${
              matchMedia("(pointer:fine)").matches && navActive
                ? styles.navActive
                : styles.navInactive
            }`}
          ></Image>
          <Swiper
            speed={400}
            slidesPerView={1}
            touchStartPreventDefault={false}
            navigation={{
              prevEl: `.${styles.leftArrow}`,
              nextEl: `.${styles.rightArrow}`,
            }}
            zoom={{
              enabled: true,
              maxRatio: 2,
              toggle: !matchMedia("(pointer:fine)").matches,
            }}
            onZoomChange={() => {
              setZoomed((zoomed) => !zoomed);
            }}
            onSlideChange={(swiper) => {
              if (zoomed) swiper.zoom.out();
              setZoomed(false);
              setImageIndex(swiper.activeIndex);
            }}
            initialSlide={imageIndex}
            onSwiper={setSwiper}
            modules={[Zoom, Navigation]}
            className={styles.productImageSwiper}
            grabCursor={true}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index} className="carousel-item">
                <div className="swiper-zoom-container">
                  <div
                    id={"zoomDiv" + index}
                    className={`${styles.productImageDiv} ${
                      zoomed && (grabbing ? styles.grabbing : styles.grabCursor)
                    } swiper-zoom-target`}
                    onMouseDown={(event) => {
                      setGrabbing(true);
                      if (
                        event.button !== 0 ||
                        !matchMedia("(pointer:fine)").matches
                      )
                        return;
                      const { clientX, clientY } = event;

                      setMouseStartingPoint({ x: clientX, y: clientY });
                     
                    }}
                    onMouseUp={(event) => {
                      setGrabbing(false);
                      if (
                        event.button !== 0 ||
                        !matchMedia("(pointer:fine)").matches
                      )
                        return;
                      const { clientX, clientY } = event;

                      const differenceX = Math.abs(
                        clientX - mouseStartingPoint.x
                      );
                      const differenceY = Math.abs(
                        clientY - mouseStartingPoint.y
                      );

                      if (differenceX < 12 && differenceY < 12) {
                        swiper.zoom.toggle(event);
                      }
                    }}
                  >
                    <Image
                      height={0}
                      width={0}
                      sizes="100vw"
                      src={image.src}
                      alt="Zoomable"
                      className={`${styles.productImage}`}
                      draggable={false}
                    />
                  </div>{" "}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default FullScreenZoomableImage;

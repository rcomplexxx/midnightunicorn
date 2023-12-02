import styles from "./productmobilepics.module.css";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper.min.css';
import FullScreenZoomableImage from "@/components/ProductPics/FullScreenZoomableImages/FullScreenZoomableImages";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

export default function ProductPics({ images }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const [mobileInterface, setMobileInterface] = useState(false);
  const [fixedMedia, setFixedMedia] = useState(0);
  const [spawnAddToCart, setSpawnAddToCart] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (zoomed) {
      router.push(router.asPath + "#zoom");

      document.body.classList.add("hideScroll");
    } else document.body.classList.remove("hideScroll");

    if (router.asPath.includes("#")) router.back();
  }, [zoomed]);

  useEffect(() => {
    if (!router.asPath.includes("#")) setZoomed(false);
  }, [router.asPath]);

  useEffect(() => {
    //129

    // Check if the element exists

    const productPicsElement = document.getElementById("productPics");
    const AddToCartEl = document.getElementById("addToCart");
    const handleScroll = () => {
      const height = productPicsElement.clientHeight;

      setFixedMedia(
        window.scrollY >= 96
          ? window.scrollY <=
            height - document.getElementById("productImages").clientHeight + 96
            ? 1
            : 2
          : 0
      );
      setSpawnAddToCart(AddToCartEl.getBoundingClientRect().bottom < 0);
    };

    const observer = new ResizeObserver((entries) => {
      const height = productPicsElement.clientHeight;
      setFixedMedia(
        window.scrollY >= 96
          ? window.scrollY <=
            height - document.getElementById("productImages").clientHeight + 96
            ? 1
            : 2
          : 0
      );
      setSpawnAddToCart(AddToCartEl.getBoundingClientRect().bottom < 0);
    });

    observer.observe(productPicsElement);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      setMobileInterface(window.innerWidth <= 980);
    };

    // Initial check and event listener setup
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const swiperRef = useRef(null);
  const thumbsSwiperRef = useRef(null);
  const sliderRefMini = useRef();

  //useMemo


  const settings = {
    speed: 400,
    slidesPerView: 1.11,
    spaceBetween: 8,
   
    
    variableWidth: false,
    centeredSlides: true,
    loop: false,

    on: {
      slideChange: (swiper) => {
        const index = swiper.activeIndex;
        if (index === imageIndex) return;
        setImageIndex(index);
        if (index < imageIndex) thumbsSwiperRef.current.slideTo(index);
        else thumbsSwiperRef.current.slideTo(index - 1);
      },
    }
  };




  const settings2 = {
    speed: 400,
    arrows: true,
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 3,
    variableWidth: false,
    centerMode: false,
    centerPadding: "0", // Set padding between centered items to 0
  };

  const fullScreenChange = (index) => {
    setImageIndex(index);
    sliderRef.current.slickGoTo(index, true);
    if (sliderRefMini.current) sliderRefMini.current.slickGoTo(index - 1, true);
    setZoomed(false);
  };

  return (
    <>
      {spawnAddToCart && (
        <div className={styles.fixedAddToCartDiv}>
          <button className={styles.fixedAddToCart}>Add to cart</button>
        </div>
      )}

      {zoomed && (
        <FullScreenZoomableImage
          imageUrl="/images/boxItem.png"
          imageIndex={imageIndex}
          fullScreenChange={fullScreenChange}
          images={images}
        />
      )}
      <div id="productPics" className={styles.productPicsWrapper}>
        <div
          id="productImages"
          className={`${fixedMedia == 1 ? styles.productPicsFixed : ""} ${
            fixedMedia == 2 ? styles.productPicsBot : ""
          }`}
        >
         <Swiper {...settings} ref={swiperRef}>
            {images.map((img, index) => (
              <SwiperSlide key={index}>
                <div
                  className={styles.productImageDiv}
                  onClick={() => setZoomed(true)}
                >
                  <Image
                    className={styles.productImage}
                    src={img.src}
                    alt={img.alt}
                    sizes="100vw"
                    height={0}
                    width={0}
                    loading={index == 0 ? "eager" : "lazy"}
                  />
                  <img className={styles.zoomImg} src={"/images/zoomIconAw.png"} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className={styles.slider2Controller}>
            {" "}
            <Slider
              ref={sliderRefMini}
              {...settings2}
              className={styles.slider2}
            >
              {images.map((img, index) => {
                return (
                  <div key={index} className="carousel-item">
                    <div
                      onClick={() => {
                    
                        setImageIndex(index);
                      }}
                      className={`${styles.productImage2Div} ${
                        imageIndex == index && styles.selectedImage
                      }`}
                    >
                      <Image
                        className={styles.productImage}
                        src={img.src}
                        alt={img.alt}
                        loading={index < 3 ? "eager" : "lazy"}
                        sizes="33vw"
                        height={0}
                        width={0}
                      />
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
          <div className={styles.grid_container}>
            {images.map((img, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    sliderRef.current.slickGoTo(index, true);
                    setImageIndex(index);
                  }}
                  className={`${styles.productImage2Div}`}
                >
                  <Image
                    className={`${styles.productImage} ${
                      imageIndex == index && styles.selectedImage
                    }`}
                    src={img.src}
                    alt={img.alt}
                    sizes="33vw"
                    height={0}
                    width={0}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

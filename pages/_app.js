import  { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";


import "../styles/globals.css";
import Navbar from "../components/Navbar/Navbar.jsx";
import {useGlobalStore} from "@/contexts/AppContext";
import Footer from "@/components/Footer/Footer";
import SEO from '@/utils/SEO-configs/next-seo.config.js'
import Head from "next/head";
import EmailFlowPopup from "@/components/EmailFlowPopup/EmailFlowPopup";
import { inter, eb_Garamond } from "@/utils/fonts";
import { DefaultSeo } from "next-seo";














export default function App({ Component, pageProps }) {
  

  
  const [emailPopup, setEmailPopup] = useState(false);

  const router = useRouter();




  const { cartProducts, setCartProducts} = useGlobalStore((state) => ({
    cartProducts: state.cartProducts,
    setCartProducts: state.setCartProducts,
 
  }));


  const deepLinkLevelRef = useRef(useGlobalStore.getState().deepLinkLevel);


  useEffect(() => {
    const unsubscribe = useGlobalStore.subscribe(
      (newState) => {
        deepLinkLevelRef.current = newState.deepLinkLevel;
      },
      (state) => state.deepLinkLevel // Select the deepLinkLevel from the state
    );

    return unsubscribe;
  }, []);



  useEffect(()=>{
    
    router.beforePopState((state) => {
      
      state.options.scroll = false;
        
      return true;
   
    });

    

    document.querySelector("html").className=`${inter.variable} ${eb_Garamond.variable}`;

    const storedCartProducts = JSON.parse(localStorage.getItem("cartProducts"));
    setCartProducts(storedCartProducts || []);




  },[])
 
  

  useEffect(() => {



    



    let popupTimeout;


    const handleRouteChangeStart = (url) => {

      clearTimeout(popupTimeout); 

   
      


      const handlePopupTurning = ()=>{


   
        console.log('my deep link level is', deepLinkLevelRef.current,"trying to turn on email popup")
    
 
       if(  url!=='/404' && (url==='/' || (url.includes('/products') && !url.includes('#zoom')
       && !url.includes('#write-review')) || url.includes('/collection') || url==='/our-story' || url==='/faq')){
 
         if(deepLinkLevelRef.current===0){
        
         setEmailPopup(true); 
         localStorage.setItem("popupShownDateInDays", Math.floor(Date.now() / 86400000));
         }
 
         else{

          const handlePopupTurningAfterDeepLink = ()=>{

        
                if(deepLinkLevelRef.current===0){

                  setEmailPopup(true); 
                  localStorage.setItem("popupShownDateInDays", Math.floor(Date.now() / 86400000));

                }
                else{
                  popupTimeout = setTimeout( handlePopupTurningAfterDeepLink, 7000)
                }

              

          }
          
          popupTimeout = setTimeout( handlePopupTurningAfterDeepLink, 5000)
         
         }
       
    
       
       }
       
      
       }
    
      
      popupTimeout= setTimeout( handlePopupTurning, 30000);
      
    };


  
    if(localStorage.getItem("popupShownDateInDays")){
      
      const emailPopupTimeChecker = Math.floor(Date.now() / 86400000)-localStorage.getItem("popupShownDateInDays");

      const daysBetweenEmailPopups = 0;

     

      if(emailPopupTimeChecker>=daysBetweenEmailPopups){
      
      handleRouteChangeStart(router.pathname);
      router.events.on('routeChangeStart', handleRouteChangeStart);
      }

      
    }
    else{
      handleRouteChangeStart(router.pathname);
      router.events.on('routeChangeStart', handleRouteChangeStart);
    }
    

  

   

  return () => {
    clearTimeout(popupTimeout); 
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };


  




  }, []);









  useEffect(() => {
    localStorage.setItem("cartProducts", JSON.stringify(cartProducts));
  }, [cartProducts]);





 







  return (
 
     
    
    <div
      id="hronika"
      className={`hronika`}>
    
   
   
        <DefaultSeo {...SEO}/>
       
      
      {emailPopup && <EmailFlowPopup setEmailPopup={setEmailPopup}/>}
    {!router.pathname.includes('admin') && <Navbar/>}

      
      
        <Component {...pageProps} />
   
   
      
      {!router.pathname.includes('admin') &&  <Footer />}
       </div>
   
     
  
  );
}

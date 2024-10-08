import paypal from "@paypal/checkout-server-sdk";
import Stripe from 'stripe';
import productsData from "../../data/products.json";

import RateLimiter from "@/utils/rateLimiter.js";
import coupons from '../../data/coupons.json'
import subscribe from '@/utils/subcsribe.js'

const getPool = require('../../utils/mariaDbPool');

const limiterPerDay = new RateLimiter({
  apiNumberArg: 3,
  tokenNumberArg: 24,
  expireDurationArg: 86400, //secs
});

// Set up your PayPal credentials
const clientId = process.env.PAYPAL_CLIENT_ID; // PayPal Client ID
const clientSecret = process.env.PAYPAL_CLIENT_SECRET; // PayPal Client Secret

// Create a PayPal client
const environment =
  process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

const paypalPay=async(totalPrice, requestShipping)=>{
  let request =  new paypal.orders.OrdersCreateRequest();


  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: totalPrice,
        },
      },
      
    ],
    application_context: {
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "UNRESTRICTED",

         shipping_preference: requestShipping?"GET_FROM_FILE":"NO_SHIPPING"
    
        
          // shipping_preference: 'SET_PROVIDED_ADDRESS', // This sets the shipping address to the one provided by the buyer
          // shipping_preference: 'NO_SHIPPING',
          // address_override: '1', // Prevents PayPal from overriding the shipping address
        
     
      },
    },
  });

 return request;
}








const makePayment = async (req, res) => {
  console.log('  reqdata BITNO ~!!!~).', req.body)

  



  let dbConnection = await getPool().getConnection();


  


  const resReturn = async(statusNumber, jsonObject)=>{

    if(dbConnection)await dbConnection.release();
    res.status(statusNumber).json(jsonObject)
   
 }




  let totalPrice;

  let giftDiscount = false;

  const putInDatabase = (paymentMethod,paymentId, approved=0) => {


   

    return new Promise(async(resolve, reject) => {
      try {
      
        //  db.prepare(`DROP TABLE IF EXISTS orders`).run();



        async function generateUniqueId() {





          // Generate four random digits
          // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

          const characters = '0123456789';
         
        
          while (true) {
        
            const timestamp = Date.now().toString(16);
        
            const randomDigits = characters.charAt(Math.floor(Math.random() * characters.length));
        
          const uniqueId = randomDigits.substring(0, 2) + timestamp.substring(0, 4) + randomDigits.substring(2, 4) + timestamp.substring(4) + randomDigits.substring(4);
        
        

          if(  (  await dbConnection.query('SELECT 1 FROM orders WHERE id = ?', [uniqueId])   ).length<1  ) return uniqueId;
        
          
        }
        
        }






       

    

  


      

        const {
          
          firstName,
          lastName,
          address,
          apt,
          country,
          zipcode,
          state,
          city,
          phone,
          couponCode,
          tip,
          items,
          subscribe:subscribed,
          email
        } = req.body.order;







        const customerInfo = (await dbConnection.query("SELECT id, used_discounts FROM customers WHERE email = ? LIMIT 1", [email]))[0];

        console.log('sooun checking', customerInfo);

        if(customerInfo && JSON.parse(customerInfo.used_discounts).find(discountCode=>discountCode===couponCode))
    
          return await resReturn(400, { success: false, error: "Discount has already been used." }, db);


        let customerId= customerInfo?.id;

        if(!customerId &&  email !== ""){

         
       

         const inserCustomerInfo = await dbConnection.query("INSERT INTO customers (email, totalOrderCount, subscribed, source) VALUES (?, ?, ?, ?)", [email, 0, 0, 'make_payment'] );
           
         customerId= inserCustomerInfo.lastInsertRowid;


        }





        const uniqueId = await generateUniqueId();



        console.log('unique key is', uniqueId)
        
      
        
        await dbConnection.query(
          `INSERT INTO orders (id, customer_id, firstName, lastName, address, apt, country, zipcode, state, city, phone, couponCode, tip, items, total, paymentMethod, paymentId, approved, createdDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        , [
          uniqueId,
          customerId,
          firstName,
          lastName,
          address,
          apt,
          country,
          zipcode,
          state,
          city,
          phone,
          couponCode,
          tip,
          JSON.stringify(items),
          totalPrice,
          paymentMethod,
          paymentId,
          approved,
          Math.floor(Date.now() / 86400000)
        ]
        );

      

      

        if(approved===1){
        
          
          console.log('its approved, sending thank you campaign');

         

          await dbConnection.query("UPDATE customers SET totalOrderCount = totalOrderCount + 1, money_spent = ROUND(money_spent + ?, 2) WHERE id = ?", [totalPrice, customerId]); 

           
          const subscribeSource = subscribed?"checkout":"checkout x"
       
          await subscribe(email, subscribeSource,  {orderId:uniqueId}, dbConnection);

        

        if(couponCode!="")await dbConnection.query(`
    UPDATE customers
    SET used_discounts = json_insert(
     used_discounts, 
      '$[#]', 
      ?
    ), money_spent = money_spent + ?
    WHERE id = ?
  `, [couponCode,customerId, totalPrice])

        giftDiscount= (await dbConnection.query(`SELECT 1 AS valid FROM customers WHERE id = ? AND totalOrderCount = 1`, [customerId]))[0]?.valid===1;
          
        

        }

      

        resolve({
          message: "Order placed successfully."
        });
      } catch (error) {
        console.error("Error in database operations:", error);
        reject("Error in database operations.");
      }
    });

  


  };

  try {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (!(await limiterPerDay.rateLimiterGate(clientIp, dbConnection))){
      
      
      return await resReturn(429, { error: "Too many requests. Please try again later." });
    }

    
    
    totalPrice = parseFloat(req.body.order.items
      .reduce((sum, product) => {
        const productInfo = productsData.find((item) => item.id === product.id);
        if (productInfo) {
          sum += productInfo.price * product.quantity;
        }
         return sum;
      }, 0) .toFixed(2));

    console.log('TOTALPRICE!',totalPrice);
    const couponCode = req.body.order.couponCode;
    console.log('discount code is!', couponCode)
    if (couponCode != "") {
      const coupon= coupons.find((c)=>{return c.code.toUpperCase()===couponCode.toUpperCase()});
      console.log('coupon is!', coupon);
      if(coupon){
      const discount= coupon.discountPercentage;
      const discountFloat = parseFloat(discount);

      totalPrice = parseFloat((totalPrice - totalPrice*discountFloat/100).toFixed(2));
     
      }

    }

    const tip =req.body.order.tip;
      if (tip && tip!="" && tip!="0") {
      
        const tipFloat = parseFloat(tip);
  
        totalPrice = totalPrice + tipFloat;
        totalPrice= parseFloat(totalPrice.toFixed(2));
        }
    console.log('Total price on server is', totalPrice)
    console.log('tip je:', req.body.order.tip);


    
    
    if(req.body.paymentMethod.includes('PAYPAL')){

      console.log('order ship info', req.body.order, req.body.paymentMethod)
    
      const requestShipping = (req.body.paymentMethod==='PAYPAL(EXPRESS)' &&  req.body.order.city==="" &&  req.body.order.address==="") || req.body.paymentMethod==='PAYPAL(INSTANT)';
    
    const request = await paypalPay(totalPrice, requestShipping);
  
    
    const response = await client.execute(request);
      console.log('Vidi response bato',response);
    // Check if the payment is approved
    if (response.result.status === "CREATED") {
     
      
     
      await putInDatabase(req.body.paymentMethod,response.result.id);

     
      return await resReturn(200, { success: true, paymentId: response.result.id });
    } else {
      // Payment was not successful


      return await resReturn(400, { success: false, error: "Payment was not approved." });

 
      

    }

  }
  else if(req.body.paymentMethod==='GPAY'){
  
    
    
 
   
    
    
  

      //Namontirati gresku ako je drzava van dozvoljenih drzava


    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: req.body.paymentToken, // Google Pay token
      },
    });

    console.log('Proso stripe tokenizaciju')



    
 
  




   

    const paymentIntent= await stripe.paymentIntents.create({
			amount: Math.round(totalPrice*100),
			currency: "USD",
      payment_method: paymentMethod.id, // Google Pay token
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
		});
    await putInDatabase('GPAY(STRIPE)',paymentIntent.client_secret, 1);


    

    return await resReturn(200, {
			
			success: true,
      giftDiscount: giftDiscount
		});
    

  






  }

  //check amount?
  else if(req.body.paymentMethod==='STRIPE'){
   
   
    
    console.log('STRIPE')
    const {stripeId} = req.body;
 

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
    const paymentIntent = await stripe.paymentIntents.create({
      amount:Math.round(totalPrice*100),
			currency: "USD",
      payment_method: stripeId, 
			automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
      },
      confirm: true
		});

  

    
    
    await putInDatabase('STRIPE',paymentIntent.client_secret, 1);

   
   
   
    

    return await resReturn(200, {
			
			success: true,
      giftDiscount: giftDiscount
		});

  }
  

  


  } catch (error) {
    // Handle errors

    console.error("Error verifying payment:", error);

    return await resReturn(500, {
			
      success: false, error: "Error occured. Payment was not approved." 
		});

    
  }
};

export default makePayment;

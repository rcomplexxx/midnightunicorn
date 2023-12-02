import betterSqlite3 from "better-sqlite3";
import reviewsData from "@/public/reviews.json";



export const getReviewsData= (productId)=>{
const limit = 20;

    try {
   
  
    
  
      const db = betterSqlite3(process.env.DB_PATH);
  
      const query = `SELECT * FROM reviews WHERE product_id = ? LIMIT ?`;
      const stmt = db.prepare(query);
  
      const result = stmt.all(productId, limit);
  
      db.close();
  
      return result.length<20?reviewsData:result;
    } catch (error) {
     return reviewsData;
    }
}
import betterSqlite3 from "better-sqlite3";
import RateLimiter from "@/utils/rateLimiter.js";
import subscribe from '@/utils/subcsribe.js'

const limiterPerMinute = new RateLimiter({
  apiNumberArg: 8,
  tokenNumberArg: 6,
  expireDurationArg: 86400, //secs
});

const dailyMessageLimit = new RateLimiter({
  apiNumberArg: 0,
  tokenNumberArg: 4,
  expireDurationArg: 60, //secs
});

const limiterPerWeek = new RateLimiter({
  apiNumberArg: 1,
  tokenNumberArg: 40,
  expireDurationArg: 604800, //secs
});

export default async function handler(req, res) {
  try {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Perform rate limiting checks

    const db = betterSqlite3(process.env.DB_PATH);

    if (!(await limiterPerMinute.rateLimiterGate(clientIp, db)))
      {
        db.close();
      return res.status(429).json({ error: "Too many requests." })
      };
    if (!(await limiterPerWeek.rateLimiterGate(clientIp, db)))
      {
        db.close();
      return res.status(429).json({ error: "Too many requests." });
      }

    // Rate limiting checks passed, proceed with API logic

    if (req.method === "POST") {
      // Handle POST requests here
      try {
        if (!req.body.type) return;

        if (req.body.type === "customers") {
          // Create a new SQLite database connection

          if(subscribe(req.body.email, req.body.source, db)){
            
              db.close();
         
          res.status(201).json({ message: "Successfully subscribed." });
            

        }
        } else if (req.body.type === "messages") {
          // Create a new SQLite database connection


          if (!(await dailyMessageLimit.rateLimiterGate(clientIp, db)))
            {
              db.close();
          return res.status(429).json({ error: "Too many messages sent." });
            
        }

         

          // Ensure the messages table exists

          const { email, name, message } = req.body.message;

              
         


            let customerId =db.prepare(`SELECT id FROM customers WHERE email = ?`).get(email)?.id;

          if(!customerId)
            customerId = db.prepare(`INSERT INTO customers (email, totalOrderCount, subscribed, source) VALUES (?, ?, ?, ?)`).run(email, 0, 0, 'message' ).lastInsertRowid;






     

          // Assuming you have the message data in the request body
       

          // Insert message data into the messages table
          db.prepare(
            `INSERT INTO messages (customer_id, name, message, msgStatus) VALUES (?, ?, ?, '0')`,
          ).run(customerId, name, message);

          console.log("Message sent successfully.");
          res.status(201).json({ message: "Message sent successfully." });

          // Close the database connection when done
          db.close();
        }
      } catch (error) {
        console.error("Error handling POST request:", error);
        res.status(500).json({ error: "Internal Server Error" });
        db.close();
      }
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
      db.close();
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal Server Error" });
    db.close();
  }
}

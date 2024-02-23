import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './newcampaign.module.css'
import {useRouter} from 'next/router'


import EmailList from './EmailList/EmailList';

export default function NewCampaign({emailData, setEmailData}) {

  const [campaignEmails, setCampaignEmails] = useState([]);
  const titleRef = useRef();

  const router = useRouter();

  console.log('camp emails', campaignEmails);

  let campaignEmailsInputString = useMemo(()=>{
    let inputString=``;
    campaignEmails.forEach(email=>{inputString=inputString+ `{Id:${email.id}, title:${email.title}, sendDate:${Date(email.sendDate).toLocaleString('en-US')}}`})
    return inputString;
  },[campaignEmails])
  

    useEffect(()=>{
        if(emailData.emails.length==0){

            (async function() {
            try {
                const response = await fetch("/api/admincheck", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(
                   { dataType:'get_emails' } 
                  ),
                });
          
                if (response.ok) {
                  const data = await response.json();
                  console.log("Maine DATA!", data);
                  //Ovde takodje zatraziti emails campaign kasnije .
                  //na slican princip kao sto sam trazio emails.
                  setEmailData(data.data);
                  console.log('Email data', data);
                 
                 
                } else {
                  throw new Error("Network response was not ok.");
                }
              } catch (error) {
                console.error(
                  "There has been a problem with your fetch operation:",
                  error
                );
              }

            })();

        }
    },[])

    const addEmail=(newEmail)=>{
      setCampaignEmails([...campaignEmails, newEmail])
    }

    const handleSaveCampaign = async()=>{


      let sortedCapaignEmails= campaignEmails.sort((a, b) => a.sendDate - b.sendDate);

      let newCampaignData = {title:titleRef.current.value, emails:JSON.stringify(sortedCapaignEmails.map((email)=>{return {id:email.id, sendDate:email.sendDate}})) };

    
     
      await fetch("/api/admincheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataType: 'send_new_capaign', data: newCampaignData }),
      })
        .then((response) => {
          if (response.ok) {
            console.log(response);
            router.push('/admin/emails');
          }
        })

        .catch((error) => {console.log(error)});
    }


  return (
    <div className={styles.mainDiv}>
      <h1>New email campaign</h1>


      <input ref={titleRef} className={styles.campaignInput} placeholder='Campaign title'/>
      <input value={campaignEmailsInputString} className={styles.campaignInput} placeholder='Included emails'/>
      <EmailList emailData={emailData} addEmail={addEmail}/>
      <button onClick={handleSaveCampaign}>Save campaign</button>
      </div>

  )
}

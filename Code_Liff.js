/**
 * ------------------------------------------------------------------
 * MODULE: LIFF & WEBHOOK HANDLER
 * จัดการ Backend สำหรับระบบสมาชิก LINE OA และ Webhook
 * Sheet ID: 1z_fsLP4BsPAD9wu0CzBua1q4-vdPkrQ8W0Pm-e4wlPM
 * ------------------------------------------------------------------
 */

const SHEET_ID_MEMBERS = "1z_fsLP4BsPAD9wu0CzBua1q4-vdPkrQ8W0Pm-e4wlPM";

// --- WEBHOOK HANDLER (NEW) ---
function doPost(e) {
  // Log เพื่อดูว่ามีอะไรส่งมาบ้าง (ดูได้ในเมนู Executions ด้านซ้าย)
  console.log("Webhook Triggered");
  
  try {
    const json = JSON.parse(e.postData.contents);
    console.log("Payload:", JSON.stringify(json)); // ดูข้อมูลที่ LINE ส่งมา

    const events = json.events;
    
    events.forEach(event => {
      // กรณีลูกค้าส่งข้อความมา
      if (event.type === 'message' && event.message.type === 'text') {
        const userMsg = event.message.text.trim();
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        console.log(`User: ${userId} said: ${userMsg}`);

        // ดักจับคำว่า "สมัครสมาชิก"
        if (userMsg === "สมัครสมาชิก") {
          // สร้าง Magic Link
          const webAppUrl = ScriptApp.getService().getUrl();
          // แนบ UID ไปกับลิงก์
          const magicLink = `${webAppUrl}?page=Register&uid=${userId}`;
          
          console.log("Replying with Magic Link: " + magicLink);
          replyWithMagicLink(replyToken, magicLink);
        }
      }
    });

    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Webhook Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function replyWithMagicLink(replyToken, link) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN === "flxqXUALWkiPN/hmhzponxTv6LTRyam48T1M1159Njb84y5KM+cb6JOp9rfnWwpAkeVqUEky4FZJ0TTzu+yllhtdTUIcUCHaClGSvTQbsSgw8Rg2yhaKBbONqmk0cDfKpBhEyCq3FkwAdC1FRdq1ZQdB04t89/1O/w1cDnyilFU=") {
      console.error("Error: LINE Channel Access Token is missing in Config.js");
      return;
  }

  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
  };
  
  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'flex',
        altText: 'ลงทะเบียนสมาชิกร้านค้า',
        contents: {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://img2.pic.in.th/pic/Profile-Alpha_0.png",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
            backgroundColor: "#FDF5E6"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ลงทะเบียนร้านค้า",
                weight: "bold",
                size: "xl",
                color: "#4A3B32"
              },
              {
                type: "text",
                text: "สำหรับลูกค้าที่ต้องการจองล็อครายเดือน หรือรับบิลออนไลน์",
                size: "sm",
                color: "#8D6E63",
                wrap: true,
                margin: "md"
              }
            ],
            backgroundColor: "#FDF5E6"
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "กรอกข้อมูลร้านค้า",
                  uri: link
                },
                style: "primary",
                color: "#8B4513"
              }
            ],
            backgroundColor: "#FDF5E6"
          }
        }
      }
    ]
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: headers,
      payload: JSON.stringify(payload)
    });
    console.log("Reply Response: " + response.getContentText());
  } catch (e) {
    console.error("Reply Failed: " + e.toString());
  }
}


// --- EXISTING FUNCTIONS (KEEP AS IS) ---

function registerLineMember(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 

    const ss = SpreadsheetApp.openById(SHEET_ID_MEMBERS);
    let sheet = ss.getSheetByName("Members");
    
    if (!sheet) {
      sheet = ss.insertSheet("Members");
      sheet.appendRow(["LineUserID", "Name", "PictureURL", "ShopName", "Phone", "Status", "RegisteredDate", "Note"]);
    }

    const userId = data.userId;
    const allData = sheet.getDataRange().getValues();
    
    let userRowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]) === String(userId)) { 
        userRowIndex = i + 1;
        break;
      }
    }

    const timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

    if (userRowIndex > -1) {
      // Update
      sheet.getRange(userRowIndex, 2).setValue(data.displayName); 
      sheet.getRange(userRowIndex, 3).setValue(data.pictureUrl);  
      sheet.getRange(userRowIndex, 4).setValue(data.shopName);    
      sheet.getRange(userRowIndex, 5).setValue(data.phone);       
      sheet.getRange(userRowIndex, 7).setValue(timestamp);        
      
      return { success: true, message: "อัปเดตข้อมูลสมาชิกเรียบร้อยแล้ว", isNew: false };
      
    } else {
      // Create
      sheet.appendRow([
        data.userId,      
        data.displayName, 
        data.pictureUrl,  
        data.shopName,    
        data.phone,       
        "Active",         
        timestamp,        
        ""                
      ]);
      
      return { success: true, message: "ลงทะเบียนสมาชิกสำเร็จ", isNew: true };
    }

  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function checkMemberStatus(userId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID_MEMBERS);
    const sheet = ss.getSheetByName("Members");
    if (!sheet) return { registered: false };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        return { 
          registered: true, 
          shopName: data[i][3], 
          phone: data[i][4],
          status: data[i][5]
        };
      }
    }
    return { registered: false };
  } catch (e) {
    return { registered: false, error: e.toString() };
  }
}
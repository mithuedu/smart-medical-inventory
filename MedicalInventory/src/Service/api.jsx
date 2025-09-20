import axios from "axios";

const BASE_URL = "https://medicalinventory.onrender.com"
const axisosInstance =axios.create({baseURL:BASE_URL})

const API_BASE = "https://my-backend-ex0j.onrender.com/api/auth";

export async function registernewstore(data) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, data: json };
  } catch (err) {
    console.error("registernewstore error:", err);
    throw err;
  }
}

export async function Otp_verification(email, otp) {
  try {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, data: json };
  } catch (err) {
    console.error("Otp_verification error:", err);
    throw err;
  }
}


// Login Authentication method
export const getAuthentication = async(data)=>{
     try {
      const respone = await axios.post(`${API_BASE}/login`,{
        "EmailID": data.EmailID,
        "password": data.Password,
        "Role":data.role
      })
      return respone
     } catch (error) {
         if (error.response) {
          return error.response.data;
         } else {
           console.log("Error:", error);
         }
     }
}


export const ForgetPassword = async(data)=>{
  try {
    const respone = await axios.post(`${API_BASE}/forgot-password`,{
      "EmailID": data.EmailID,
    })
    return respone
  } catch (error) {
    if (error.response) {
      return error.response;
     } else {
       console.log("Error:", error);
     }
  }
}

export const SetPassword = async(data)=>{
  try {
    const respone = await axios.post(`${API_BASE}/reset-password`,{
      "EmailID": data.EmailID,
      "newpassword": data.newpassword,
      "OTP": data.OTP
    })
    return respone
  } catch (error) {
     console.log(error)
  }
}

export const DeleteUser = async (data) => {
  try {
    const response = await axios.delete(`${BASE_URL}/delete-user`, {
      data: { id: data }
    });
    return response;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else {
      console.log("Error:", error);
    }
  }
};


export const BlockUser = async(data,status)=>{
  try {
    const respone = await axios.post(`${BASE_URL}/statusUpdate`,{
      "id": data,
      "status": status,
    })
    return respone
   } catch (error) {
       if (error.response) {
        return error.response.data;
       } else {
         console.log("Error:", error);
       }
   }
}


export const FetchShoplist = async () => {
  try {
    const respone = await axios.get(`${BASE_URL}/User_data`)
    return respone
   } catch (error) {
       if (error.response) {
        return error.response.data;
       } else {
         console.log("Error:", error);
       }
   }
};

//  Medicine

export const AddnewMedicine = async (data) => {
  try {
      const base64Image = await toBase64(data.image);
      const respone = await axios.post(`${BASE_URL}/AddMedicine`,{
        "table_name":data.category,
        "medicine_name": data.name,
        "description": data.description,
        "price": data.price,
        "available_units": data.availableStock,
        "expiry_date": data.expiryDate,
        "image": base64Image
      })
      return respone
  } catch (error) {
    console.log(error);
  }
};

const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const GetMedicineList = async()=>{
  try {
    const respone = await axios.get(`${BASE_URL}/MedicinesData`,{})
    return respone
  } catch (error) {
    console.log(error)
  }
}

export const DeleteMedicinedata  = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/DeleteMedicine/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return { success: false, error: error.message };
  }
};

export const ModifyMedicinedata  = async (data,Medicine_ID) => {
  try {
    const base64Image = await toBase64(data.image);
    const response = await axios.post(`${BASE_URL}/UpdateMedicine/${Medicine_ID}`, {
      table_name: data.category,
      medicine_name: data.name,
      description: data.description,
      price: data.price,
      available_units: data.availableStock,
      expiry_date: data.expiryDate,
      image: base64Image
   });
   return response
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return { success: false, error: error.message };
  }
};


export const chatbot = async(userMessage)=>{
  try {
  
        const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
        const headers = {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json",
        };
    
        const payload = {
            "model": "deepseek/deepseek-r1:free",
            "messages": [
                {"role": "system", "content": "You are a pharmacy assistant. Help users find OTC medicines, provide basic dosage info, and advise when to see a doctor. Keep responses concise. Do not use bold formatting (**) in responses."},
                {"role": "user", "content": userMessage}
            ]
        };
    
       
        const response = await axios.post(API_URL, payload, { headers });
        if (response.status === 200) {
            let botReply = response.data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request.";
            botReply = botReply.replace(/\*\*/g, "");
            return botReply.substring(0, 500)
        } else {
            return `Error: ${response.status}, ${response.data}`;
        }
    
  } catch (error) {
     console.log(error)
  }
}

export const placeOrder = async (items, custoemrdetails, paymentmode, address) => {
  try {
    const updatedItems = items.map(item => ({
      Medicinename: String(item.Productname),
      quantity: String(item.Quantity),
      amount: String(item.Price)
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.Price, 0);

    const response = await axios.post(`${BASE_URL}/OrderMedicine`,
      {
        "username": custoemrdetails.username,
        "location": custoemrdetails.userCurrentLocation,
        "medicines": updatedItems,
        "total_amount": totalAmount,
        "payment_mode": paymentmode,
        "delivery_address": {
        "bill_to": address.name,
        "mobile_number": address.mobileNumber,
        "address_details": address.address,
        "pincode": address.pincode,
        "city": address.city,
        "state": address.state,
        "country": "India"
      }
    })
  
   return (response)
  } catch (error) {
    console.log(error);
  }
};

export const fetchorder = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/GetAllorders`)
    return (response)
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};


export const FetchOrderslist = async (username) => {
  try {
    const response = await axios.get(`${BASE_URL}/GetAllorders`);
    const filteredOrders = response.data.orders.filter(order => order.username === username);
    return filteredOrders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const changestatusapi = async (id,type) => {
  try {
    console.log(id,type)
    const response = await axios.post(`${BASE_URL}/UpdateOrderStatus`,{
      "order_id": id,
      "new_status": type
    });
    return response;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};
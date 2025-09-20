import leftBanner from "../../Assest/SVG/loginbanner.svg";
import chart from "../../Assest/SVG/loginchaticon.svg";
import doubt from "../../Assest/SVG/logindoubticon.svg";
import { Link, useNavigate } from "react-router-dom";
import { Otp_verification } from "../../Service/api";
import { useState } from "react";
import Otp_card from "../Cards/Otp_card";

const Password_reset=()=> {
  const [Otp,setotp]=useState(new Array(6).fill(""))
  const Navigate = useNavigate()
  const [confirmToggle,setConfirm]=useState(true)
  const onSubmit = async() => {
    try {
      const result = await Otp_verification(Otp.join(''))
      setConfirm(false)
      console.log(result)
    } catch (error) {
      console.log(error)
    }
  };
  return (
    <div className="flex flex-col lg:flex-row lg:px-16 w-full lg:h-[100dvh]">
        {/* Left Container */}
        <div className="lg:w-[55%] h-full p-3 lg:p-5">
            <img src={leftBanner} className="w-full h-full" />
        </div>
        {/* Right Container */}
        <div className=" lg:w-[50%] flex flex-col lg:h-full p-5">
          <div className=" flex flex-col gap-3 mt-auto mb-auto">
            <div className="flex items-center justify-center">
            </div>
            {
              confirmToggle ? (
                <>     
               <div className="text-center">
                   <h1 className="text-[33px] lg:text-[40px] text-[#514242]">Password Reset</h1>
                   <h1 className="font-light text-[15px] text-[#423C3C]">We sent a code to <b>karthi@goaira.com</b> mail</h1>
               </div>
               {/* Login Form */}
               <div className=" justify-center py-4 md:py-8 flex flex-col items-center gap-8">
                 <div className="w-full max-w-[500px] flex flex-col gap-3">
                    <div className="w-full max-w-[500px] flex gap-2">
                        <Otp_card Otp={Otp} setotp={setotp} len={6} />
                    </div>
                 </div>
                  {  
                     Otp.every((digit) => digit !== "")&& (
                      <input  className="bg-[#FF8811] w-full max-w-[500px] h-[70px] rounded-xl text-white text-[20px] cursor-pointer" type="submit" value="Submit" onClick={onSubmit}/>
                    )
                  }
                 <div className=" w-full max-w-[500px] h-[40px] font-light flex flex-row gap-5 py-5 items-center">
                    <Link to="/" className="flex flex-row items-center mr-auto gap-2 cursor-pointer">
                       <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM21 7L1 7V9L21 9V7Z" fill="black"/>
                       </svg>
                       Back to login
                   </Link>
                 </div>
               </div>
                
                </>
              ):(<>
                 <div className="w-full flex flex-col items-center justify-center py-5">
                        <h1 className="text-[33px] lg:text-[35px] text-[#514242]">Password Reset Successful</h1>
                        <h1 className="font-light text-[15px] text-[#423C3C]">Your new password has been securely <br></br> sent to your registered email address.</h1>
                        <div className="py-5 w-full flex items-center justify-center ">
                        <input  className="bg-[#FF8811] w-full max-w-[500px] h-[70px] rounded-xl text-white text-[20px] cursor-pointer py-5" type="submit" value="Home" onClick={()=>Navigate('/')}/>
                        </div>
                  </div>              
              </>)
            }
               {/* Contact Option */}
               {/* <div className=" w-full max-w-[500px] mr-auto ml-auto h-[40px] font-light flex flex-row gap-5 text-[#5B5959] py-10 items-center justify-center">
                  <div className="flex flex-row items-center  justify-end gap-2 h-full cursor-pointer">
                     <img src={chart} alt="" className="w-[24px] opacity-80" />
                     <p>Chat with us</p>
                  </div>
                  <div className="flex flex-row items-center justify-end gap-2 h-full cursor-pointer">
                     <img src={doubt} alt="" className="w-[24px] opacity-80" />
                     <p>Help</p>
                  </div>
               </div> */}
           </div>
        </div>
     </div>
  )
}

export default Password_reset

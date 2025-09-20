import { useEffect, useRef} from "react";

function Otp_card({len,Otp,setotp}) {
    const inputRefs=useRef([])

    useEffect(()=>{
      return ()=>{
        if(inputRefs.current[0]){
          inputRefs.current[0].focus()
        }
      }
    },[])

    const handlechange=(e,index)=>{
      const value=e.target.value;
      if(isNaN(value)) return;
      const newotp=[...Otp];
      newotp[index]=value.substring(value.len-1);
      setotp(newotp)
      if(value && index < len-1 && inputRefs.current[index+1])
      {
        inputRefs.current[index+1].focus()
      }
    }
  
    const backspace = (e, index) => {
      if (e.key === "Backspace" && !Otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
      if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
      if (e.key === "ArrowRight" && index < len-1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    };
    
    const handleclick=(index)=>{
      inputRefs.current[index].setSelectionRange(0,1)
    }

  return (
    <div>
        <div className="w-full max-w-[500px] flex gap-1 laptop:gap-2 laptop:px-5">
          {
            Otp.map((value,index)=>{
              return(
                <input key={index} ref={(input)=>(inputRefs.current[index]=input)}  className={`bg-[#EFEFEF] text-[22px] w-full text-[#423C3C] h-[53px] text-center md:h-[65px] rounded-md md:rounded-xl  font-light `} type="text" value={value} maxLength={1}
                   onChange={(e)=>{handlechange(e,index)}}
                   onKeyDown={(e)=>{backspace(e,index)}}
                   onClick={()=>{handleclick(index)}}
                 />
              )
            })
          }
       </div>
    </div>
  )
}

export default Otp_card
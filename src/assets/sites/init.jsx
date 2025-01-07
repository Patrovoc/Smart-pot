import {useContext, useEffect, useRef, useState} from "react";
import {GlobalContext} from "../Context/GlobalContext.jsx";
import {useNavigate} from "react-router-dom";

function App() {
    const [isHidden, setIsHidden] = useState(true); //For revealing rest of form
    const [questionWiFi, toggleQuestionWiFi] = useState(false); //For hiding Wi-Fi question until its necessary

    const { variables, updateVariables } = useContext(GlobalContext);
    const [retryCount, setRetryCount] = useState(0); // Track the number of retries

    const navigate = useNavigate();  // Initialize the navigate function

    useEffect(() => {
        updateVariables()
            .then(() => {
                if(variables.isConfigured !== undefined){
                    console.log(variables.isConfigured)
                    if(variables.isConfigured == 1){
                        navigate('/main');
                    }
                }
                else {
                    setRetryCount(retryCount+1)
                    console.log(variables.isConfigured)
                }

            })
    }, [retryCount]);


    const nameRef = useRef();
    const plantRef = useRef();
    const wifiRef = useRef();
    const ssidRef = useRef();
    const passwordRef = useRef();

    const toggleVisibility = () => {
        setIsHidden(!isHidden);
    };

    const handleWiFiChange = (event) => {
        toggleQuestionWiFi(event.target.value === 'yes');
    };

    const sendForm = () => {
        if(nameRef.current.value !== "" && plantRef.current.value !== ""){
            const name = nameRef.current.value;
            const plant = plantRef.current.value;
            const wifi = wifiRef.current.value;
            if(ssidRef.current !== undefined){
                const ssid = ssidRef.current.value;
                const password = passwordRef.current.value;
                fetch("/set-vars", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        deviceName: name,
                        plantName: plant,
                        isStandalone: wifi,
                        ssid: ssid,
                        password: password,
                        isConfigured: true
                    }),
                });
            }
            else{
                const ssid = ssidRef.current.value;
                const password = passwordRef.current.value;
                fetch("/set-vars", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        deviceName: name,
                        ESP32SSID: ssid,
                        ESP32Password: password,
                        plantName: plant,
                        isStandalone: wifi,
                        isConfigured: true
                    }),
                });
            }
            updateVariables()

            navigate("/")
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            toggleVisibility();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={"page"}>
            <div className={"header"}>Welcome!</div>
            {isHidden ? null:
                <div className={"formInit"}>
                    <div className={"sHeader"}>Please enter initial configuration:</div>
                    <div className={"inputgroup"}>
                        <label htmlFor="name">Device name</label>
                        <input type="text" id="name" name="name" ref={nameRef} placeholder="For example: Planter666, BestDeviceEver..." required/>
                    </div>
                    <div className={"inputgroup"}>
                        <label htmlFor="plant">What are you going to plant?</label>
                        <input type="text" id="plant"  name="plant" ref={plantRef} placeholder="" required/>
                    </div>

                    <div className={"inputgroup"}>
                        <label>Do you want to connect to Wi-Fi?</label>
                        <div className={"radiogroup"}>
                            <label htmlFor="wifi">
                                Yes<input type="radio" id="yes" name="wifi" value="yes" ref={wifiRef} onChange={handleWiFiChange}/>
                            </label>
                            <label htmlFor="no">
                                No<input type="radio" id="no" name="wifi" value="no" onChange={handleWiFiChange}/>
                            </label>
                        </div>
                    </div>
                    {questionWiFi ?
                        <div className={"comeIn"}>
                            <div className={"inputgroup"}>
                                <label htmlFor="ssid">Wi-FI SSID</label>
                                <input type="text" id="ssid" name="ssid" ref={ssidRef} placeholder="" required/>
                            </div>
                            <div className={"inputgroup"}>
                                <label htmlFor="wifipassword">Wi-FI password</label>
                                <input type="password" id="wifipassword" name="wifipassword" ref={passwordRef} placeholder="" required/>
                            </div>
                        </div>
                        :
                        <div className={"comeIn"}>
                            <div className={"inputgroup"}>
                                <label htmlFor="ssid">Pot SSID</label>
                                <input type="text" id="ssid" name="ssid" ref={ssidRef} placeholder="" required/>
                            </div>
                            <div className={"inputgroup"}>
                                <label htmlFor="wifipassword">Password</label>
                                <input type="password" id="wifipassword" name="wifipassword" ref={passwordRef}
                                       placeholder="" required/>
                            </div>
                        </div>
                    }
                    <div className={"formfooter"}>
                        <button className={"buttonSend"} onClick={sendForm}>Continue</button>
                    </div>
                </div>
            }
        </div>
    );
}

export default App
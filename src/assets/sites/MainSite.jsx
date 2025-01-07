import {useContext, useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {GlobalContext} from "../Context/GlobalContext.jsx";

function MainSite() {
    const { variables, updateVariables } = useContext(GlobalContext);
    const [retryCount, setRetryCount] = useState(0); // Track the number of retries
    const [scrollVariable, setScrollVariable] = useState(0)

    const scrollRef = useRef();

    const navigate = useNavigate();  // Initialize the navigate function

    const scrollChange = () => {
        setScrollVariable(scrollRef.current.value)
        fetch("/set-vars", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                soilThreshold: scrollRef.current.value
            }),
        });
    };

    const reset = async () => {
        setScrollVariable(scrollRef.current.value)
        fetch("/set-vars", {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({
                reset: 1
            }),
        });
        updateVariables()
        const timer = setTimeout(() => {
            window.location.reload();
        }, 2000);

    };

    useEffect(() => {
        updateVariables()
            .then(() => {
                if(variables.isConfigured !== undefined){
                    console.log(variables.isConfigured)
                    if(variables.isConfigured == 0){
                        navigate('/init');
                    }
                    setScrollVariable(scrollRef.current.value)
                }
                else {
                    setRetryCount(retryCount+1)
                    console.log(variables.isConfigured)
                }

            })
    }, [retryCount]);

    return (
        <div className={"page"}>
            <div className={"header"}>
                {variables.plantName}
            </div>
            <button onClick={() => reset()}>Reset</button>
            <div className={"pot-container"}>
                <div className={"flower-pot-border"}/>
                {variables.waterLevel ?
                    <div className={"flower-pot"}/>
                    :
                    <>
                        <div className={"flower-pot-low-water"}/>
                    </>
                }

                <div className={"flower-pot-inside"}/>
            </div>
            {variables.waterLevel ?
                <div className={"MainCol"}>
                    <p>Water level:</p>
                    <p>OK</p>
                </div>
                :
                <div className={"MainCol"}>
                    <p>Water level:</p>
                    <p>Low!</p>
                </div>
            }

            <div className={"MainCol"}>
                <p>Soil percentage:</p>
                <p>{variables.soilPercentage} %</p>
            </div>
            <div className={"MainCol"}>
                <p>Soil threshold:</p>
                <p>{scrollVariable} %</p>
                <input className={"buttonSend"} ref={scrollRef} onChange={() =>scrollChange()} type="range" id="soilThre" name="soilThre" min="0" max="100"/>
            </div>
            <div className={"MainCol"}>
                <button className={"buttonSend"} onClick={async () => {
                    updateVariables()
                    const timer = setTimeout(() => {
                        if (!variables.isConfigured) {
                            window.location.reload();
                        }z
                    }, 2000);

                }}>Refresh
                </button>
                </div>
            </div>
            )
            }

            export default MainSite

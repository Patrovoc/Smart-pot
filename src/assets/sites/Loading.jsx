import {useEffect} from "react";

function Loading() {

    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.reload();
        }, 5000);

        // Cleanup timer if the component unmounts
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={"page"}>
            <div className={"loader"}></div>
        </div>
    )
}
export default Loading
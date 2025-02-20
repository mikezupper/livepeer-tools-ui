const bearerToken = import.meta.env.VITE_GATEWAY_BEARER_TOKEN;
export const defaultGatewayUrl = import.meta.env.VITE_GATEWAY_URL;
const defaultNavLink = import.meta.env.VITE_NAVIGATION_LINK;

export const getBearerToken = ()=>{
    return bearerToken ? bearerToken: "None"
}

export const getGatewayUrl = () => {
    let value = localStorage.getItem("gatewayUrl")
    if(!value){
       // console.log(`[getGatewayUrl] NO value [${value}] ...  setting default to : ${defaultGatewayUrl} `)

        setGatewayUrl(defaultGatewayUrl)
        value = defaultGatewayUrl;
    }
    // console.log("[getGatewayUrl] returning url = ", value)
    return value;
}

export const setGatewayUrl = (gatewayUrl) => {
    // console.log("[setGatewayUrl] setting url = ", gatewayUrl)
    localStorage.setItem("gatewayUrl", gatewayUrl)
    // console.log("[setGatewayUrl] completed.")
}

export const getDefaultNavLink = () => {
    let value = localStorage.getItem("defaultNavLink")
    if(!value){
        setDefaultNavLink(defaultNavLink)
        value = defaultNavLink;
    }
    // console.log("[getDefaultNavLink] returning url = ", value)
    return value;
}
export const setDefaultNavLink = (navLink) => {
    // console.log("[setDefaultNavLink] set ", navLink)
    localStorage.setItem("defaultNavLink", navLink)
    // console.log("[setDefaultNavLink] completed.")
}

export const num_between = (x, min, max) => {
    return x >= min && x <= max;
};

// Specify the fields that need to be integers or numbers
export const intFields = ["width", "height", "guidance_scale", "num_inference_steps", "num_images_per_prompt","seed","motion_bucket_id","fps","strength","max_tokens"];
export const floatFields = ["noise_aug_strength"];


import React from 'react'
import { Button, Elevation, FileInput, Card} from "@blueprintjs/core"
import { getTypeFromMimeType, Metadata} from './lib/metadata'
import { putToIPFS } from './lib/ipfs'
import { MediaDisplay } from './MediaDisplay'

type UploaderProps = {
    activeConfig: number
}

export function Uploader(props: UploaderProps) {

    const [meta, setMeta]               = React.useState(new Metadata())
    const [title, setTitle]             = React.useState<string>();
    const [loading, setLoading]         = React.useState(false)
    const [fileObj, setFileObj]         = React.useState<File>();
    const [mediaSrc, setMediaSrc]       = React.useState<string>();
    const [mimeType, setMimeType]       = React.useState<string>();
    const [unitName, setUnitName]       = React.useState<string>();
    const [assetName, setAssetName]     = React.useState<string>();
    const form = {
        unitName: {
            set: setUnitName,
            get: unitName
        },
        assetName: {
            set: setAssetName,
            get: assetName
        },
    }

    function setFile(file: File) {
        setFileObj(file)

        const reader = new FileReader();
        reader.onload = (e: any) => {  setMediaSrc(e.target.result) }
        reader.readAsDataURL(file);

        setMimeType(file.type)
        setTitle(file.name)

        setMeta((meta)=>{
            const metaObj = {
                ...meta,
                properties:{...meta.properties, size:file.size, title:file.name}
            }

            const mediaType = getTypeFromMimeType(file.type)
            switch(mediaType){
                case 'audio':
                    metaObj.animation_url = file.name
                    metaObj.animation_url_mimetype = file.type
                    break;
                case 'video':
                    metaObj.animation_url = file.name
                    metaObj.animation_url_mimetype = file.type
                    break;
                case 'image':
                    metaObj.image = file.name
                    metaObj.image_mimetype = file.type
                    break;
            }

            return new Metadata(metaObj)
        })
    }

    async function uploadMedia() {
        setLoading(true)
        
        if(unitName.length > 8) {
            alert("Unit name MUST be 8 bytes or less");
            setLoading(false);
        }

        const md = new Metadata({
            ...meta,
            name: assetName,
            unitName: unitName,
            description:`POAP Minted at ${process.env.REACT_APP_EVENT_NAME} ${new Date().getFullYear()}`,
            decimals: 0,
        }) 
        setMeta(md)

        try {
            await putToIPFS(props.activeConfig, fileObj, md)
            setLoading(false)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert("Failed to upload image to ipfs :(")
            setLoading(false)
            return
        }
    }

    function onInputChange(event) {
        form[event.target.name].set(event.target.value);
    }

    return (
        <div className='container'>
            <Card elevation={Elevation.TWO} className='mint-card' >
                <UploadContainer mediaTitle={title} mimeType={mimeType} mediaSrc={mediaSrc} setFile={setFile} {...meta} />
                <input name='assetName' onChange={onInputChange} placeholder="Asset Name"></input>
                <input name='unitName' onChange={onInputChange} placeholder="Unit name"></input>
                <Button intent='success' style={{float:'right', margin:"15px"}} loading={loading} onClick={uploadMedia}>Upload</Button>
            </Card>
        </div>
    )

}

type UploaderContainerProps = {
    mediaTitle: string | undefined
    mediaSrc: string | undefined
    mimeType: string | undefined
    setFile(f: File): void
};

function UploadContainer(props: UploaderContainerProps) {
    function captureFile(event: any) {
        event.stopPropagation()
        event.preventDefault()
        props.setFile(event.target.files.item(0))
    }

    if (props.mediaSrc === undefined || props.mediaSrc === "" ) return (
        <div className='container'>
            <div className='content content-piece' >
                <FileInput large={true} disabled={false} text="Choose file..." onInputChange={captureFile} />
            </div>
        </div>
    )

    return (
        <div className='container' >
            <div className='content content-piece'>
                <MediaDisplay unitName={""} name={""} title={props.mediaTitle} mimeType={props.mimeType} mediaSrc={props.mediaSrc} />
            </div>
        </div>
    )
}
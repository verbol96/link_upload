const fs=require('fs');
const {Order,Photo,File,User}=require('../models/models');
const FileService=require('./fileService');

const getDateSent=(typePost)=>{
    const dateSent=new Date();
    dateSent.setHours(0,0,0,0);
    dateSent.setDate(dateSent.getDate()+2);

    if(dateSent.getDay()===0){
        const isEuropePost=typePost==='E'||typePost==='E1';
        dateSent.setDate(dateSent.getDate()+(isEuropePost?2:1));
    }else if(dateSent.getDay()===1&&(typePost==='E'||typePost==='E1')){
        dateSent.setDate(dateSent.getDate()+1);
    }else if(dateSent.getDay()===6){
        dateSent.setDate(dateSent.getDate()-1);
    }

    return dateSent;
};

const saveTelegramFile=async(fileData,parent,photoId)=>{
    const fileName=fileData.fileName;
    let filePath=`${process.env.FILEPATH}/${parent.path}/${parent.name}/${fileName}`;
    let fileExists=fs.existsSync(filePath);
    let count=1;
    let newFileName=fileName;

    while(fileExists){
        const fileNameWithoutExtension=fileName.split('.').slice(0,-1).join('.');
        const fileExtension=fileName.split('.').pop();
        newFileName=`${fileNameWithoutExtension} (${count}).${fileExtension}`;
        filePath=`${process.env.FILEPATH}/${parent.path}/${parent.name}/${newFileName}`;
        fileExists=fs.existsSync(filePath);
        count++;
    }

    fs.writeFileSync(filePath,fileData.buffer);

    const type=newFileName.split('.').pop();

    return await File.create({
        name:newFileName,
        type,
        size:fileData.buffer.length,
        path:`${parent.path}/${parent.name}`,
        parent:parent.id,
        photoId
    });
};

const createTelegramOrder=async({clientId,phone,ownerType,notes,files,downloadTelegramFile})=>{
    let client=null;

    if(clientId){
        client=await User.findOne({
            where:{id:clientId}
        });
    }

    if(!client){
        client=await User.create({
            phone,
            typePost:'E'
        });
    }

    let owner=client;

    if(ownerType==='nefediev'){
        owner=await User.findOne({
            where:{phone:'+375333509124'}
        });

        if(!owner){
            throw new Error('Пользователь Нефедьев не найден в LINK');
        }
    }

    const typePost=client.typePost||'E';
    const dateSent=getDateSent(typePost);

    const order=await Order.create({
        codeOutside:'',
        price:'0',
        price_deliver:'0',
        other:'',
        notes:notes||'',
        status:0,
        typePost,
        postCode:client.postCode||'',
        city:client.city||'',
        adress:client.adress||'',
        oblast:client.oblast||'',
        raion:client.raion||'',
        FIO:client.FIO||'',
        phone:client.phone,
        userId:owner.id,
        origin:'telegram',
        date_sent:dateSent
    });

    const photo=await Photo.create({
        type:'photo',
        format:'a6',
        amount:files.length,
        copies:1,
        paper:'glossy',
        orderId:order.id
    });

    const mainDirName=`T${order.order_number%1000}`;
    const mainDirResult=await FileService.createdDir(mainDirName);

    const mainDir=await File.create({
        name:mainDirResult.name,
        type:'dir',
        parent:'00000000-0000-0000-0000-000000000000',
        isDownload:false
    });

    await Order.update(
        {
            main_dir_id:mainDir.id
        },
        {
            where:{id:order.id}
        }
    );

    const photoDirResult=await FileService.createdDir(
        'telegram',
        mainDir.name
    );

    const photoDir=await File.create({
        name:photoDirResult.name,
        type:'dir',
        parent:mainDir.id,
        path:mainDir.name
    });

    for(const file of files){
        const telegramFile=await downloadTelegramFile(
            file.fileId,
            file.fileName
        );

        await saveTelegramFile(
            telegramFile,
            photoDir,
            photo.id
        );
    }

    return {
        order,
        photo,
        client,
        owner,
        mainDir
    };
};

module.exports={
    createTelegramOrder
};
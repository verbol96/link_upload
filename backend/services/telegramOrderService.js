
const fs=require('fs');
const path=require('path');
const {Order,Photo,File,User}=require('../models/models');
const FileService=require('./fileService');

const getDateSent=typePost=>{
    const dateSent=new Date();
    dateSent.setHours(0,0,0,0);
    dateSent.setDate(dateSent.getDate()+2);

    const isEuropePost=typePost==='E'||typePost==='E1';

    if(dateSent.getDay()===0){
        dateSent.setDate(dateSent.getDate()+(isEuropePost?2:1));
    }else if(dateSent.getDay()===1&&isEuropePost){
        dateSent.setDate(dateSent.getDate()+1);
    }else if(dateSent.getDay()===6){
        dateSent.setDate(dateSent.getDate()-1);
    }

    return dateSent;
};

const saveTelegramFile=async(fileData,parent,photoId,transaction)=>{
    const fileName=path.basename(
        String(fileData.fileName).replace(/\\/g,'/')
    );

    const directory=path.join(
        process.env.FILEPATH,
        parent.path,
        parent.name
    );

    const parsed=path.parse(fileName);

    let name=fileName;
    let count=1;

    while(fs.existsSync(path.join(directory,name))){
        name=`${parsed.name} (${count++})${parsed.ext}`;
    }

    await fs.promises.writeFile(
        path.join(directory,name),
        fileData.buffer,
        {flag:'wx'}
    );

    return File.create({
        name,
        type:path.extname(name).slice(1),
        size:fileData.buffer.length,
        path:`${parent.path}/${parent.name}`,
        parent:parent.id,
        photoId
    },{transaction});
};

const createTelegramOrder=async({
    clientId,
    phone,
    ownerType,
    notes,
    groups,
    files,
    downloadTelegramFile
})=>{
    const batches=groups||[{
        notes,
        files:files||[],
        skipped:[]
    }];

    if(!batches.length||!batches.some(g=>g.files.length||g.skipped?.length)){
        throw new Error('Нет файлов');
    }

    let createdDirectory=null;

    try{
        return await Order.sequelize.transaction(async transaction=>{
            let client=clientId
                ?await User.findOne({
                    where:{id:clientId},
                    transaction
                })
                :null;

            if(!client){
                client=await User.findOne({
                    where:{phone},
                    transaction
                });
            }

            if(!client){
                client=await User.create({
                    phone,
                    typePost:'E'
                },{transaction});
            }

            let owner=client;

            if(ownerType==='nefediev'){
                owner=await User.findOne({
                    where:{phone:'+375333509124'},
                    transaction
                });

                if(!owner){
                    throw new Error('Пользователь Нефедьев не найден в LINK');
                }
            }

            const typePost=client.typePost||'E';

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
                date_sent:getDateSent(typePost)
            },{transaction});

            const mainDirResult=await FileService.createdDir(
                `T${order.order_number%1000}`
            );

            createdDirectory=path.join(
                process.env.FILEPATH,
                mainDirResult.name
            );

            const mainDir=await File.create({
                name:mainDirResult.name,
                type:'dir',
                parent:'00000000-0000-0000-0000-000000000000',
                isDownload:false
            },{transaction});

            await order.update({
                main_dir_id:mainDir.id
            },{transaction});

            const photos=[];
            const completedGroups=[];

            for(const [i,group] of batches.entries()){
                const photo=await Photo.create({
                    type:'photo',
                    format:'a6',
                    amount:group.files.length,
                    copies:1,
                    paper:'glossy',
                    orderId:order.id
                },{transaction});

                photos.push(photo);

                const dir=await FileService.createdDir(
                    batches.length===1?'telegram':`telegram_${i+1}`,
                    mainDir.name
                );

                const photoDir=await File.create({
                    name:dir.name,
                    type:'dir',
                    parent:mainDir.id,
                    path:mainDir.name
                },{transaction});

                const completed={
                    notes:group.notes,
                    files:[],
                    skipped:[...(group.skipped||[])]
                };

                for(const file of group.files){
                    let telegramFile;

                    try{
                        telegramFile=await downloadTelegramFile(
                            file.fileId,
                            file.fileName,
                            file.size
                        );
                    }catch(error){
                        completed.skipped.push(file);
                        continue;
                    }

                    await saveTelegramFile(
                        telegramFile,
                        photoDir,
                        photo.id,
                        transaction
                    );

                    completed.files.push(file);
                }

                await photo.update({
                    amount:completed.files.length
                },{transaction});

                completedGroups.push(completed);
            }

            await order.update({
                notes:completedGroups.map(g=>
                    `${g.notes||''} (${g.files.length} файлов${g.skipped.length?` + ${g.skipped.length} вручную`:''})`
                ).join('\n')
            },{transaction});

            return {
                order,
                photo:photos[0],
                photos,
                client,
                owner,
                mainDir,
                groups:completedGroups
            };
        });
    }catch(error){
        if(createdDirectory){
            await fs.promises.rm(createdDirectory,{
                recursive:true,
                force:true
            }).catch(err=>console.error('Telegram cleanup:',err));
        }

        throw error;
    }
};

module.exports={
    createTelegramOrder
};

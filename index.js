const port=4000;
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken")
const multer=require("multer");
const path=require("path")//using this we can get access to our backend directory in our express app
const cors=require("cors");
const { type } = require("os");
const { error } = require("console");

app.use(express.json())//with the help of express.json whatever request we will get from response that will be automatically passed through json

app.use(cors());//using this our react js project willl connect to express app on 4000 port

//data base connection with mongoDB

mongoose.connect("mongodb+srv://raghavchopra:raghav555@cluster0.2s5if.mongodb.net/")

//API creation
app.get("/",(req,res)=>{
    res.send("express app is running")

})

//Schema creating for user model
const Users=mongoose.model('Users',{  //Use mongoose.model to create a model based on the schema. This will create a collection in MongoDB with the name specified (converted to lowercase and pluralized).
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,

    },
    date:{
        type:Date,
        default:Date.now
    }
})
//craeting api to rgisterr user
app.post('/signup',async (req,res)=>{
    const check=await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user find with same email id"})
    }
    let cart={};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;
        
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart

    })
    await user.save();
    const data={ //in data we have created a key user and added object
        user:{
            id:user.id

        }
    }
    const token=jwt.sign(data,'secret_ecom');
    res.json({success:true,token})

})
//end  point for user login
app.post('/login',async (req,res)=>{
    let user=await Users.findOne({email:req.body.email})
    if(user){
        const passcompare=req.body.password===user.password;
        if(passcompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token})
        }
        else{
            res.json({success:false,errors:"wrong password"});
        }

    }
    else{
        res.json({success:false,errors:"Wrong Email Id"})
    }

})
//creating middleware to fetch user
const fetchUser=async (req,res,next)=>{
    const token=req.header('auth-token')
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try {
            const data=jwt.verify(token,'secret_ecom');//decoding token
            req.user=data.user;
            next();

            
        } catch (error) {
            res.status(401).send({
                errors:"Please authenticate using valid token"
            })
            
        }
    }

}

//creating endpoint to data to the cart
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("added",req.body.itemId)

    console.log(req.body,req.user)
    let userData= await Users.findOne({_id:req.user.id});
    // console.log(userData);
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("added")

})
//creating end point to remove product from cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId)
    // console.log(req.body,req.user)
    let userData= await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    // console.log(userData);
    userData.cartData[req.body.itemId]-=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("removed")
})
//creating end point to get cart data
app.post('/getcart',fetchUser,async(req,res)=>{
    let userData=await Users.findOne({_id:req.user.id})
    res.json(userData.cartData);
})
app.listen(
    port,(err)=>{
        if(!err){
            console.log("server running on port "+port)
        }
        else{
            console.log("Error : "+err)
        }
    }
)



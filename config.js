/* =========================================
   config.js  (load 1st, needs nothing)
   All the game settings and data lists.
   Edit this file to change rules, add difficulty modes,
   add ingredients or add customer names.
   ========================================= */

const CONFIG = {
  GAME_SECONDS:120,
  POINTS_CORRECT:10,
  POINTS_PENALTY:5,
  QUEUE_SIZE:4,
  COINS_CORRECT:5,
  UNLOCK_COST:10,
  BAKE_SECONDS:1.5
};

/* DIFFICULTY MODES
   Seconds each customer waits before leaving. To add a mode, add one line.
   The buttons on the start screen appear in this order. */
const DIFFICULTIES = {
  easy:   {label:"Easy",       seconds:25},
  normal: {label:"Normal",     seconds:20},
  hard:   {label:"Hard",       seconds:15},
  super:  {label:"Super Hard", seconds:10}
};

/* INGREDIENT DATABASE
   Items with unlocked:true are free from the start. The rest cost coins.
   To add a topping, also add a  case "your-id":  in toppingArt() in art.js. */
const INGREDIENTS = {
  base:[
    {id:"chocolate",label:"Chocolate",emoji:"🍫",color:"#6b3f26",unlocked:true},
    {id:"vanilla",label:"Vanilla",emoji:"🍦",color:"#f3deaa",unlocked:true},
    {id:"strawberry",label:"Strawberry",emoji:"🍓",color:"#f4a0b5",unlocked:true},
    {id:"redvelvet",label:"Red Velvet",emoji:"❤️",color:"#bd394d"},
    {id:"lemon",label:"Lemon",emoji:"🍋",color:"#f7dc69"},
    {id:"coffee",label:"Coffee",emoji:"☕",color:"#9b6848"},
    {id:"carrot",label:"Carrot",emoji:"🥕",color:"#df8b43"},
    {id:"matcha",label:"Matcha",emoji:"🍵",color:"#9cb77a"}
  ],

  frosting:[
    {id:"chocolate",label:"Chocolate",emoji:"🍫",color:"#4a2a18",unlocked:true},
    {id:"vanilla",label:"Vanilla",emoji:"🍦",color:"#fff4d6",unlocked:true},
    {id:"pink",label:"Strawberry",emoji:"🌸",color:"#ff8fb8",unlocked:true},
    {id:"creamcheese",label:"Cream Cheese",emoji:"🧀",color:"#fff0d0"},
    {id:"caramel",label:"Caramel",emoji:"🍯",color:"#d99a42"},
    {id:"blueberry",label:"Blueberry",emoji:"🫐",color:"#7778b9"},
    {id:"matcha",label:"Matcha",emoji:"🍵",color:"#9bbd7a"},
    {id:"ube",label:"Ube",emoji:"💜",color:"#a68bd2"}
  ],

  topping:[
    {id:"cherry",label:"Cherry",emoji:"🍒",color:"#d8143a",unlocked:true},
    {id:"strawberry",label:"Strawberry",emoji:"🍓",color:"#ff4d6d",unlocked:true},
    {id:"sprinkles",label:"Sprinkles",emoji:"✨",color:"#ffd66b",unlocked:true},
    {id:"blueberry",label:"Blueberries",emoji:"🫐",color:"#5965a9"},
    {id:"banana",label:"Banana",emoji:"🍌",color:"#f4d65d"},
    {id:"oreo",label:"Oreo",emoji:"🍪",color:"#4b342a"},
    {id:"almonds",label:"Almonds",emoji:"🥜",color:"#c99a68"},
    {id:"chips",label:"Choco Chips",emoji:"🍫",color:"#68412d"},
    {id:"marshmallow",label:"Marshmallow",emoji:"🍡",color:"#fff0e5"},
    {id:"peach",label:"Peach",emoji:"🍑",color:"#f3a17f"},
    {id:"macaron",label:"Macaron",emoji:"🧁",color:"#d9a3cc"}
  ]
};

const LAYERS = ["base","frosting","topping"];
const LAYER_NAMES = {
  base:"Cake Base",
  frosting:"Frosting",
  topping:"Topping"
};

const CUSTOMER_NAMES = [
  "Mia","Luna","Sophie","Oliver","Emma","Noah","Chloe",
  "Leo","Ava","Theo","Bella","Ellie","Milo","Daisy","Lily"
];

/* Customer faces are drawn as SVG: see randomLook() and customerSVG() in art.js. */
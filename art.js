/* =========================================
   art.js  (load 2nd)
   SVG ARTWORK
   Every picture in the game is drawn here as SVG:
   customers, ingredient cards, cake toppings and small icons.
   Needs: config.js. It also uses $ and pick from game.js,
   but only when called, so load order is fine.
   ========================================= */

const LINE = "#6e4a3a";   /* outline color shared by all drawings */

/* A small icon from the sprite sheet at the top of index.html.
   Example: ic("star") gives you the star icon. */
function ic(name) {
  return `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

/* ---------- CUSTOMERS ----------
   Each customer gets a random look made from these lists.
   Add a color to a list (or a new style in customerSVG) to get more variety. */
const SKIN_TONES   = ["#ffe0c2","#f6cba3","#d9a074","#a8704a","#7b4f35"];
const HAIR_COLORS  = ["#3b2418","#7a4524","#d9a13b","#d94f7a","#5a6fd1","#2e2a3a"];
const HAIR_STYLES  = ["bun","pigtails","bob","short"];
const ACCESSORIES  = ["none","none","glasses","bow"];

function randomLook() {
  return {
    skin:pick(SKIN_TONES),
    hair:pick(HAIR_COLORS),
    style:pick(HAIR_STYLES),
    acc:pick(ACCESSORIES)
  };
}

function customerSVG(customer) {
  const look = customer.look;
  const o = `stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"`;

  /* hair drawn behind the face */
  let behind = "";
  if(look.style === "bun") {
    behind = `<circle cx="32" cy="9" r="7" fill="${look.hair}" ${o}/>`;
  } else if(look.style === "pigtails") {
    behind = `<circle cx="9" cy="38" r="7" fill="${look.hair}" ${o}/>
              <circle cx="55" cy="38" r="7" fill="${look.hair}" ${o}/>`;
  } else if(look.style === "bob") {
    behind = `<path d="M11 42Q8 10 32 9Q56 10 53 42Q53 50 46 50H18Q11 50 11 42Z" fill="${look.hair}" ${o}/>`;
  }

  /* hair drawn in front of the forehead */
  const fringe = look.style === "short"
    ? `<path d="M13 31Q13 10 32 10Q51 10 51 31Q47 24 40 21Q30 25 22 20Q16 23 13 31Z" fill="${look.hair}" ${o}/>`
    : `<path d="M13 33Q12 11 32 11Q52 11 51 33Q46 22 36 22Q28 27 20 22Q15 24 13 33Z" fill="${look.hair}" ${o}/>`;

  let accessory = "";
  if(look.acc === "glasses") {
    accessory = `<g fill="rgba(255,255,255,.35)" stroke="${LINE}" stroke-width="2">
                   <circle cx="25" cy="37" r="6"/><circle cx="39" cy="37" r="6"/>
                   <path d="M31 37h2" fill="none"/>
                 </g>`;
  } else if(look.acc === "bow") {
    accessory = `<g fill="#ff8fb8" stroke="${LINE}" stroke-width="2" stroke-linejoin="round">
                   <path d="M19 14L10 9V19Z"/><path d="M19 14L28 9V19Z"/><circle cx="19" cy="14" r="3"/>
                 </g>`;
  }

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${behind}
    <circle cx="32" cy="36" r="19" fill="${look.skin}" ${o}/>
    ${fringe}
    <circle cx="25" cy="37" r="2.4" fill="#3b2418"/><circle cx="39" cy="37" r="2.4" fill="#3b2418"/>
    <circle cx="25.8" cy="36.2" r=".8" fill="#fff"/><circle cx="39.8" cy="36.2" r=".8" fill="#fff"/>
    <circle cx="20" cy="43" r="3.6" fill="#ff9db3" opacity=".6"/><circle cx="44" cy="43" r="3.6" fill="#ff9db3" opacity=".6"/>
    <path d="M28 44Q32 48 36 44" stroke="#3b2418" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${accessory}
  </svg>`;
}

/* ---------- TOPPINGS ----------
   Each topping is drawn in a 48 x 48 box with its bottom edge near y = 44.
   The same drawing is used on the cake, on the ingredient card, in the
   order ticket and in the recipe book.
   To add a topping: add it to INGREDIENTS (config.js), then add a  case "your-id":  below. */
function toppingArt(id,color) {
  const o = `stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"`;

  switch(id) {

    case "cherry":
      return `<path d="M24 20Q26 9 37 6" stroke="#3b8a3b" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="24" cy="31" r="13" fill="${color}" ${o}/>
              <circle cx="19" cy="26" r="3.5" fill="#fff" opacity=".6"/>`;

    case "strawberry":
      return `<path d="M24 44C8 37 7 17 24 15C41 17 40 37 24 44Z" fill="${color}" ${o}/>
              <path d="M13 16L24 8L35 16L24 20Z" fill="#7ccf8f" ${o}/>
              <g fill="#ffe3a0">
                <ellipse cx="17" cy="26" rx="1.6" ry="2.2"/><ellipse cx="31" cy="26" rx="1.6" ry="2.2"/>
                <ellipse cx="24" cy="31" rx="1.6" ry="2.2"/><ellipse cx="18" cy="35" rx="1.6" ry="2.2"/>
                <ellipse cx="30" cy="35" rx="1.6" ry="2.2"/>
              </g>`;

    case "sprinkles": {
      /* [x, y, rotation, color] for each little rod */
      const bits = [[14,30,-30,"#ffd66b"],[27,21,25,"#6bd6ff"],[35,34,60,"#ff6b9d"],[20,40,10,"#9bd9b4"],
                    [37,21,-50,"#ffffff"],[9,40,50,"#ff6b9d"],[31,42,-20,"#ffd66b"],[24,32,80,"#6bd6ff"]];
      return bits.map(b =>
        `<rect x="${b[0]-6}" y="${b[1]-2.2}" width="12" height="4.4" rx="2.2" fill="${b[3]}" stroke="${LINE}" stroke-width="1.4" transform="rotate(${b[2]} ${b[0]} ${b[1]})"/>`
      ).join("");
    }

    case "blueberry": {
      const berries = [[23.5,22],[15,36],[32,36]];
      return berries.map(b =>
        `<circle cx="${b[0]}" cy="${b[1]}" r="8.5" fill="${color}" ${o}/>
         <circle cx="${b[0]}" cy="${b[1]-2}" r="2.4" fill="rgba(0,0,0,.25)"/>
         <circle cx="${b[0]-3}" cy="${b[1]-4.5}" r="1.6" fill="#fff" opacity=".55"/>`
      ).join("");
    }

    case "banana": {
      const slices = [[24,20],[15,34],[33,34]];
      return slices.map(b =>
        `<circle cx="${b[0]}" cy="${b[1]}" r="10" fill="${color}" ${o}/>
         <circle cx="${b[0]}" cy="${b[1]}" r="6" fill="#fff1b8"/>
         <circle cx="${b[0]}" cy="${b[1]}" r="1.4" fill="#b58a2c"/>`
      ).join("");
    }

    case "oreo":
      return `<g transform="rotate(-10 24 32)">
                <rect x="9" y="29" width="30" height="6" rx="3" fill="#fff8ee" ${o}/>
                <rect x="7" y="20" width="34" height="10" rx="5" fill="${color}" ${o}/>
                <rect x="7" y="34" width="34" height="10" rx="5" fill="${color}" ${o}/>
                <path d="M14 24H26M14 39H24" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/>
              </g>`;

    case "almonds": {
      const almond = (x,y,rot) =>
        `<g transform="translate(${x} ${y}) rotate(${rot} 8 11)">
           <path d="M8 0C17 5 17 17 8 22C-1 17 -1 5 8 0Z" fill="${color}" ${o}/>
           <path d="M8 5Q10 11 8 17" stroke="rgba(255,255,255,.45)" stroke-width="2" fill="none" stroke-linecap="round"/>
         </g>`;
      return almond(16,15,0) + almond(4,22,-25) + almond(27,22,25);
    }

    case "chips": {
      const chip = (x,y,rot) =>
        `<g transform="translate(${x} ${y}) rotate(${rot} 8 6)">
           <path d="M0 12Q1 3 8 0Q15 3 16 12Q8 15 0 12Z" fill="${color}" stroke="#3d2417" stroke-width="2" stroke-linejoin="round"/>
           <path d="M5 9Q8 5 11 9" stroke="rgba(255,255,255,.4)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
         </g>`;
      /* scattered flat so they read as chips, not a pile */
      return chip(9,16,-10) + chip(24,15,15) + chip(2,29,-25) + chip(16,29,8) + chip(30,27,25);
    }

    case "marshmallow":
      return `<g transform="rotate(14 33 24)">
                <rect x="25" y="16" width="16" height="16" rx="6.5" fill="${color}" ${o}/>
                <path d="M28 29Q33 32 38 29" stroke="#ffc9d9" stroke-width="3" fill="none" stroke-linecap="round"/>
              </g>
              <rect x="8" y="26" width="17" height="17" rx="7" fill="${color}" ${o}/>
              <path d="M11 39Q16.5 42 22 39" stroke="#ffc9d9" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M12 31H17" stroke="#ffc9d9" stroke-width="2.5" stroke-linecap="round"/>`;

    case "peach":
      return `<circle cx="24" cy="29" r="14.5" fill="${color}" ${o}/>
              <circle cx="31" cy="34" r="6" fill="#ff9d8a" opacity=".5"/>
              <path d="M24 15Q17 29 24 43" stroke="rgba(110,74,58,.45)" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M24 15Q31 4 40 9Q34 17 24 15Z" fill="#7ccf8f" ${o}/>`;

    case "macaron":
      return `<path d="M7 26Q7 13 24 13Q41 13 41 26Z" fill="${color}" ${o}/>
              <path d="M7 32H41Q41 44 24 44Q7 44 7 32Z" fill="${color}" ${o}/>
              <rect x="7" y="26" width="34" height="6" rx="3" fill="#fff8ee" ${o}/>
              <path d="M15 20Q19 16 25 16" stroke="rgba(255,255,255,.6)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;

    default:
      /* any topping without its own drawing becomes a simple colored ball */
      return `<circle cx="24" cy="30" r="13" fill="${color}" ${o}/>
              <circle cx="19" cy="25" r="3.5" fill="#fff" opacity=".5"/>`;
  }
}

/* ---------- INGREDIENT CARD PICTURES ----------
   Bases and frostings are drawn from the item's color, so a new base or
   frosting in INGREDIENTS automatically gets a picture. */
function ingredientIcon(layer,item) {
  const o = `stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"`;
  let art = "";

  if(layer === "base") {
    art = `<path d="M5 20Q5 12 13 12H35Q43 12 43 20V37Q43 43 37 43H11Q5 43 5 37Z" fill="${item.color}" ${o}/>
           <path d="M7 29H41" stroke="#fff" stroke-width="4" opacity=".5"/>
           <path d="M12 19H22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>`;
  } else if(layer === "frosting") {
    /* dripping icing, the same style as the frosting on the cake */
    art = `<path d="M6 16Q6 10 12 10H36Q42 10 42 16Q42 21 38 21Q37 31 33 31Q29 31 29 22H27Q26 36 22 36Q18 36 18 23H16Q15 29 11 29Q8 29 8 21Q6 20 6 16Z" fill="${item.color}" ${o}/>
           <path d="M12 15H22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  } else {
    art = toppingArt(item.id,item.color);
  }

  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${art}</svg>`;
}

/* ---------- BUTTON AND OVEN LABELS (text + icon) ---------- */
function setServeLabel(isBaking) {
  $("serve-btn").innerHTML = isBaking
    ? ic("flame") + " Baking..."
    : ic("cupcake") + " Bake &amp; Serve";
}

function setOven(icon,text) {
  $("oven-status").innerHTML = ic(icon) + " " + text;
}
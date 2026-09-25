var PP_FORMS=[['powder',/\bpowders?\b|\bground\b/i],['flakes',/\bflakes?\b|\bcrushed\b/i],['sauce',/\bsauce\b|\bketchup\b|\bsriracha\b|\bdip\b/i],['paste',/\bpaste\b|\bpuree\b/i],['oil',/\boils?\b/i],['pickle',/\bpickles?\b|\bachar\b/i],['chutney',/\bchutney\b/i],['seeds',/\bseeds?\b/i],['syrup',/\bsyrup\b|\bsugar\b|\bjaggery\b|\bhoney\b/i],['vinegar',/\bvinegar\b/i],['juice',/\bjuice\b|\bsquash\b|\bconcentrate\b/i],['milk',/\bmilk\b/i],['dried',/\bdried\b|\bdry\b|\bdehydrated\b|\bsun.?dried\b|\bkasuri\b|\bkasoori\b|\bqasuri\b|\bkasurimethi\b|\bkasturi\s*methi\b/i],['fresh',/\bfresh\b/i]];
function ppFormOf(t){t=String(t||'');for(var i=0;i<PP_FORMS.length;i++){if(PP_FORMS[i][1].test(t))return PP_FORMS[i][0];}return null;}
const ALIAS=[["chickpea", "chickpeas", "kabuli chana", "kabuli channa", "chole", "chhole", "white chana", "chana (kabuli"], ["rajma", "kidney bean"], ["palak", "spinach"], ["coriander", "dhania", "cilantro", "kothimbir"], ["mint", "pudina"], ["bhindi", "okra", "lady finger", "ladyfinger", "lady's finger"], ["potato", "aloo", "batata"], ["onion", "pyaaz", "pyaz", "kanda", "shallot", "shallots", "eerulli", "irulli"], ["tomato", "tamatar"], ["cauliflower", "gobi", "gobhi"], ["cabbage", "patta gobhi"], ["green peas", "peas", "matar"], ["methi", "fenugreek", "kasuri", "kasturi", "kasoori", "qasuri"], ["cumin", "jeera"], ["turmeric", "haldi"], ["ginger", "adrak", "shunti"], ["garlic", "lehsun", "bellulli"], ["chilli", "chili", "chilly", "mirchi", "mirch", "lal mirch", "laal mirch", "lal mirchi", "degi mirch"], ["wheat flour", "atta"], ["semolina", "suji", "sooji", "rava"], ["besan", "gram flour", "chickpea flour"], ["curd", "dahi"], ["yogurt", "yoghurt", "greek yogurt", "skyr", "hung curd"], ["egg", "eggs", "anda"], ["rice", "chawal", "akki"], ["toor dal", "arhar dal", "tur dal", "arhar", "tur", "toor"], ["masoor", "red lentil"], ["moong", "mung", "green gram"], ["urad", "black gram"], ["bottle gourd", "lauki", "sorekai"], ["brinjal", "baingan", "eggplant", "aubergine"], ["capsicum", "bell pepper", "shimla mirch"], ["cucumber", "kheera", "sowthekaayi", "soutekaayi", "sowtekaayi", "hasiru soutekaayi"], ["carrot", "gajar"], ["beetroot", "chukandar"], ["lemon", "nimbu", "lime", "nimbe"], ["coconut", "nariyal", "thenginakayi"], ["tender coconut", "elaneer", "coconut water"], ["mustard", "sarson", "rai"], ["peanut", "groundnut", "moongphali"], ["jaggery", "gud"], ["tamarind", "imli"], ["asafoetida", "hing"], ["fennel", "saunf"], ["carom", "ajwain"], ["cardamom", "elaichi"], ["cinnamon", "dalchini"], ["black pepper", "kali mirch", "kaali mirch", "peppercorn", "pepper powder"], ["drumstick", "moringa", "nuggekai"], ["poha", "flattened rice", "avalakki"], ["vermicelli", "seviyan", "semiya"], ["pomegranate", "anar"], ["prawn", "jhinga", "shrimp"], ["curry leaves", "kadi patta", "karibevu"], ["green chilli", "hari mirch"], ["ghee", "tuppa"], ["buttermilk", "chaas", "majjige"], ["fish", "pomfret", "basa", "tilapia", "salmon", "sardine", "mackerel", "seer fish", "surmai", "anjal", "machli", "meen"], ["malai", "fresh cream", "heavy cream", "whipping cream", "cream", "dairy cream", "uht cream", "cooking cream"], ["ragi atta", "ragi flour"], ["hot sauce", "chilli sauce", "red chilli sauce"], ["bread", "beed"], ["yelakki", "yellaki", "elakki"], ["daal", "dal"], ["soy sauce", "soya sauce"], ["berries", "blueberry", "blackberry", "strawberry"], ["protein powder", "plant protein", "whey"], ["cooking oil", "oil"], ["byadagi", "byadgi", "byadgi chilli", "dried chilli", "dried chillies", "dried red chill", "dried red chilli", "dried red chillies", "dry chilli", "dry red chilli", "kashmiri red chilli", "red chilli", "red chilli dried", "red chilli whole", "whole red chilli", "red chilly whole", "red chilly"], ["bay leaf", "tej patta", "tejpatta", "tej pata"], ["clove", "laung", "lavang"], ["poppy seeds", "khus khus", "khuskhus"], ["nigella", "kalonji", "kalaunji"], ["mace", "javitri"], ["raisin", "kishmish", "raisins"], ["pistachio", "pista"], ["cashew", "kaju", "cashewnut"], ["cowpea", "lobia", "black eyed peas", "black-eyed peas"], ["french beans", "hurulikaayi", "bili hurulikaayi", "hurulikayi", "haricot beans", "haricot bean", "french bean"], ["sesame", "til", "ellu"], ["pearl millet", "bajra"], ["roasted gram", "fried gram", "roasted chana", "roasted channa"], ["mayo", "mayonnaise", "mayonaise", "eggless mayo"], ["ketchup", "tomato ketchup"], ["chaat masala", "chat masala"], ["sweet corn", "corn", "american corn", "corn cob", "bhutta", "makkai"], ["basil", "fresh basil", "italian basil", "basil leaves", "sweet basil"], ["sambar", "sambhar", "sambaar", "sambar masala", "sambhar masala"], ["kala chana", "black chana", "brown chana", "kala channa", "desi chana"]];
var PP_ALIAS_GROUPS=[["chickpea", "chickpeas", "kabuli chana", "kabuli channa", "chole", "chhole", "white chana", "chana (kabuli"], ["rajma", "kidney bean"], ["palak", "spinach"], ["coriander", "dhania", "cilantro", "kothimbir"], ["mint", "pudina"], ["bhindi", "okra", "lady finger", "ladyfinger", "lady's finger"], ["potato", "aloo", "batata"], ["onion", "pyaaz", "pyaz", "kanda", "shallot", "shallots", "eerulli", "irulli"], ["tomato", "tamatar"], ["cauliflower", "gobi", "gobhi"], ["cabbage", "patta gobhi"], ["green peas", "peas", "matar"], ["methi", "fenugreek", "kasuri", "kasturi", "kasoori", "qasuri"], ["cumin", "jeera"], ["turmeric", "haldi"], ["ginger", "adrak", "shunti"], ["garlic", "lehsun", "bellulli"], ["chilli", "chili", "chilly", "mirchi", "mirch", "lal mirch", "laal mirch", "lal mirchi", "degi mirch"], ["wheat flour", "atta"], ["semolina", "suji", "sooji", "rava"], ["besan", "gram flour", "chickpea flour"], ["curd", "dahi"], ["yogurt", "yoghurt", "greek yogurt", "skyr", "hung curd"], ["egg", "eggs", "anda"], ["rice", "chawal", "akki"], ["toor dal", "arhar dal", "tur dal", "arhar", "tur", "toor"], ["masoor", "red lentil"], ["moong", "mung", "green gram"], ["urad", "black gram"], ["bottle gourd", "lauki", "sorekai"], ["brinjal", "baingan", "eggplant", "aubergine"], ["capsicum", "bell pepper", "shimla mirch"], ["cucumber", "kheera", "sowthekaayi", "soutekaayi", "sowtekaayi", "hasiru soutekaayi"], ["carrot", "gajar"], ["beetroot", "chukandar"], ["lemon", "nimbu", "lime", "nimbe"], ["coconut", "nariyal", "thenginakayi"], ["tender coconut", "elaneer", "coconut water"], ["mustard", "sarson", "rai"], ["peanut", "groundnut", "moongphali"], ["jaggery", "gud"], ["tamarind", "imli"], ["asafoetida", "hing"], ["fennel", "saunf"], ["carom", "ajwain"], ["cardamom", "elaichi"], ["cinnamon", "dalchini"], ["black pepper", "kali mirch", "kaali mirch", "peppercorn", "pepper powder"], ["drumstick", "moringa", "nuggekai"], ["poha", "flattened rice", "avalakki"], ["vermicelli", "seviyan", "semiya"], ["pomegranate", "anar"], ["prawn", "jhinga", "shrimp"], ["curry leaves", "kadi patta", "karibevu"], ["green chilli", "hari mirch"], ["ghee", "tuppa"], ["buttermilk", "chaas", "majjige"], ["fish", "pomfret", "basa", "tilapia", "salmon", "sardine", "mackerel", "seer fish", "surmai", "anjal", "machli", "meen"], ["malai", "fresh cream", "heavy cream", "whipping cream", "cream", "dairy cream", "uht cream", "cooking cream"], ["ragi atta", "ragi flour"], ["hot sauce", "chilli sauce", "red chilli sauce"], ["bread", "beed"], ["yelakki", "yellaki", "elakki"], ["daal", "dal"], ["soy sauce", "soya sauce"], ["berries", "blueberry", "blackberry", "strawberry"], ["protein powder", "plant protein", "whey"], ["cooking oil", "oil"], ["byadagi", "byadgi", "byadgi chilli", "dried chilli", "dried chillies", "dried red chill", "dried red chilli", "dried red chillies", "dry chilli", "dry red chilli", "kashmiri red chilli", "red chilli", "red chilli dried", "red chilli whole", "whole red chilli", "red chilly whole", "red chilly"], ["bay leaf", "tej patta", "tejpatta", "tej pata"], ["clove", "laung", "lavang"], ["poppy seeds", "khus khus", "khuskhus"], ["nigella", "kalonji", "kalaunji"], ["mace", "javitri"], ["raisin", "kishmish", "raisins"], ["pistachio", "pista"], ["cashew", "kaju", "cashewnut"], ["cowpea", "lobia", "black eyed peas", "black-eyed peas"], ["french beans", "hurulikaayi", "bili hurulikaayi", "hurulikayi", "haricot beans", "haricot bean", "french bean"], ["sesame", "til", "ellu"], ["pearl millet", "bajra"], ["roasted gram", "fried gram", "roasted chana", "roasted channa"], ["mayo", "mayonnaise", "mayonaise", "eggless mayo"], ["ketchup", "tomato ketchup"], ["chaat masala", "chat masala"], ["sweet corn", "corn", "american corn", "corn cob", "bhutta", "makkai"], ["basil", "fresh basil", "italian basil", "basil leaves", "sweet basil"], ["sambar", "sambhar", "sambaar", "sambar masala", "sambhar masala"], ["kala chana", "black chana", "brown chana", "kala channa", "desi chana"]];
var PP_ALIAS_DERIVED=/poha|flatten|puff|murmura|flour|noodle|batter|papad|vermicelli|\brava\b|\btari\b|\bcakes?\b|\bsemolina\b|\bsuji\b|\bsooji\b/i;
function ppAliasWb(a,b){try{return new RegExp("(^|[^a-z])"+a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([^a-z]|$)").test(b);}catch(e){return false;}}
function ppAliasSingulars(k){var o=[];if(k.length>4&&k.slice(-3)==="ies")o.push(k.slice(0,-3)+"y");if(k.length>3&&k.slice(-2)==="es")o.push(k.slice(0,-2));if(k.length>2&&k.slice(-1)==="s"&&k.slice(-2)!=="ss")o.push(k.slice(0,-1));return o;}
function ppAliasIsTerm(k,g){var sg=ppAliasSingulars(k);for(var i=0;i<g.length;i++){if(k===g[i])return g[i];for(var j=0;j<sg.length;j++)if(sg[j]===g[i])return g[i];}return null;}
function ppAliasPlaced(kws){var p={};for(var i=0;i<(kws||[]).length;i++){var k=String(kws[i]).toLowerCase();for(var gi=0;gi<PP_ALIAS_GROUPS.length;gi++){var g=PP_ALIAS_GROUPS[gi];if(ppAliasIsTerm(k,g)){p[k]=1;}if(p[k])break;}}return p;}
function ppGroupsHit(kws){var pl=ppAliasPlaced(kws);var best={};for(var gi=0;gi<PP_ALIAS_GROUPS.length;gi++){var g=PP_ALIAS_GROUPS[gi];var b=null;for(var ki=0;ki<(kws||[]).length;ki++){var k=String(kws[ki]).toLowerCase();var der=PP_ALIAS_DERIVED.test(k);var cand=ppAliasIsTerm(k,g);var ex=cand!==null;if(!ex){if(pl[k])continue;for(var ti2=0;ti2<g.length;ti2++){if(ppAliasWb(g[ti2],k)&&(!der||PP_ALIAS_DERIVED.test(g[ti2]))){if(cand===null||g[ti2].length>cand.length)cand=g[ti2];}}}if(cand!==null&&(b===null||cand.length>b.length))b=cand;}if(b!==null)best[gi]=b;}var n=0;for(var a in best){if(!best.hasOwnProperty(a))continue;var drop=false;for(var c in best){if(!best.hasOwnProperty(c)||c===a)continue;if(best[a]!==best[c]&&ppAliasWb(best[a],best[c])){drop=true;break;}}if(!drop)n++;}return n;}
function ppGroupSig(kws){/* RULE 151b: WHICH alias groups a label touches, not how many.
   ppGroupsHit counts; the handover needs the identity so it can tell that "Bell pepper" and
   "Red bell pepper" name one food. Same loop, same vocabulary, collecting each group's first term
   instead of incrementing -- deliberately beside its sibling so the two cannot drift. */
/* Rule 151c applies here too, or the sibling that must not drift would drift on the very first capsicum label. */
/* RULE 151d APPLIES HERE TOO, AND THE DRIFT THE HEADER WARNS ABOUT HAD ALREADY HAPPENED. 30-Aug.
   ppGroupsHit gained 151d — when two groups claim the same words the MORE SPECIFIC one wins — and
   this sibling kept the old "first term of every group that hit" loop, so the two disagreed on the
   labels 151d was written for. Measured against the shipped bundle:
     'green chilli (certified organic)'  ppGroupsHit 1   ppGroupSig ["chilli","green chilli"]
     'red chilli powder'                 ppGroupsHit 1   ppGroupSig ["chilli","dried red chill"]
   assignFoodKeys reads `g.length===1 ? g[0] : null`, so every one of those labels got a NULL food
   key and never merged with its own twin — the ambiguity was manufactured by the missing drop, not
   present in the label. This is the same body as ppGroupsHit, tracking each group's LONGEST matched
   term and dropping a group whose term sits, as a word, inside another's; it emits g[0] where the
   sibling increments, which is the only difference the header ever intended. Its length is now
   ppGroupsHit's count by construction, so the two cannot drift again. */
var pl=ppAliasPlaced(kws);var best={};
for(var gi=0;gi<PP_ALIAS_GROUPS.length;gi++){var g=PP_ALIAS_GROUPS[gi];var b=null;
 for(var ki=0;ki<(kws||[]).length;ki++){var k=String(kws[ki]).toLowerCase();
  var der=PP_ALIAS_DERIVED.test(k);var cand=ppAliasIsTerm(k,g);
  if(cand===null){if(pl[k])continue;
   for(var ti2=0;ti2<g.length;ti2++){
    if(ppAliasWb(g[ti2],k)&&(!der||PP_ALIAS_DERIVED.test(g[ti2]))){
     if(cand===null||g[ti2].length>cand.length)cand=g[ti2];}}}
  if(cand!==null&&(b===null||cand.length>b.length))b=cand;}
 if(b!==null)best[gi]=b;}
var out=[];
for(var a in best){if(!best.hasOwnProperty(a))continue;var drop=false;
 for(var c in best){if(!best.hasOwnProperty(c)||c===a)continue;
  if(best[a]!==best[c]&&ppAliasWb(best[a],best[c])){drop=true;break;}}
 if(!drop)out.push(PP_ALIAS_GROUPS[a][0]);}
return out.sort();}
var PP_DERIVED=/poha|flatten|puff|murmura|flour|noodle|batter|papad|vermicelli|\brava\b|\btari\b|\bcakes?\b|\bsemolina\b|\bsuji\b|\bsooji\b/i;
function expandKws(kws){var out={},add=function(t){out[String(t).toLowerCase()]=1;};
 kws.forEach(function(k){k=String(k).toLowerCase();add(k);
  var derived=PP_DERIVED.test(k);
  var placed=PP_ALIAS_GROUPS.some(function(g){return ppAliasIsTerm(k,g)!==null;});
  PP_ALIAS_GROUPS.forEach(function(g){
   var exact=ppAliasIsTerm(k,g)!==null;
   var near=!placed&&g.some(function(t){t=String(t).toLowerCase();
     return _wb(t,k)&&(!derived||PP_DERIVED.test(t));});
   if(exact||near)g.forEach(add);});});
 return Object.keys(out);}
function ppLB1(n,k){if(!k)return false;var i=-1;while((i=n.indexOf(k,i+1))>=0){var c=i===0?'':n.charAt(i-1);if(!/[a-z]/.test(c)){var j=i+k.length,t='';while(j<n.length&&/[a-z]/.test(n.charAt(j))){t+=n.charAt(j);j++;}if(t===''||/^(s|es|ies|er|ers|e|f|ves|i)$/.test(t))return true;}}return false;}
function ppKwSing(k){var o=[],P=[['ies','i'],['es',''],['s','']];for(var x=0;x<P.length;x++){var suf=P[x][0];if(k.length-suf.length>=3&&k.slice(-suf.length)===suf){var c=k.slice(0,k.length-suf.length)+P[x][1];if(c&&c!==k&&o.indexOf(c)<0)o.push(c);}}return o;}
var PP_MODW={red:1,green:1,yellow:1,white:1,black:1,brown:1,dark:1,sweet:1,sour:1,hot:1,raw:1,dry:1,dried:1,whole:1,baby:1,mixed:1,mix:1,french:1,broken:1,flattened:1,roasted:1,smoked:1,spiny:1,pointed:1,elephant:1,bitter:1};
function ppTokHit(t,w){if(t===w)return true;return t.indexOf(w)===0&&/^(s|es|ies|er|ers|e|f|ves|i)$/.test(t.slice(w.length));}
function ppLBInfix(n,k){var K=String(k).match(/[a-z]+/g)||[];if(K.length<2)return false;var sp=[],rx=/[a-z]+/g,m;while((m=rx.exec(n)))sp.push([m[0],m.index,m.index+m[0].length]);for(var s=0;s<sp.length;s++){if(!ppTokHit(sp[s][0],K[0]))continue;var i=s,gap=0,good=true;for(var q=1;q<K.length;q++){var w=K[q],j=i+1;while(j<sp.length&&!ppTokHit(sp[j][0],w)){if(PP_MODW[sp[j][0]]===1){good=false;break;}j++;}if(!good||j>=sp.length){good=false;break;}var mid=n.slice(sp[i][2],sp[j][1]);if(mid.indexOf(',')>=0||mid.indexOf('&')>=0){good=false;break;}gap+=j-i-1;i=j;}if(good&&gap<=4)return true;}return false;}
function ppLB(n,k){if(!k)return false;if(ppLB1(n,k))return true;var ss=ppKwSing(String(k));for(var i=0;i<ss.length;i++){if(ppLB1(n,ss[i]))return true;}return ppLBInfix(n,String(k));}
var PP_PKG=/\b(jar|bag|pouch|packet|pack|box|bottle|tin|can|carton|sachet|shaker|tray|basket|punnet|net|glass|plastic|steel|mug|cup|artwork|empty|half|full|sealed|opened|part used|near|approx|blurry|loose|unopened|remaining|leftover)\b/i;
function ppPkgStrip(s){return String(s).replace(/\(([^)]*)\)/g,function(m,inner){return PP_PKG.test(inner)?' ':m;});}
function ppOkFactory(label,opts){opts=opts||{};
  var PROC=/masala|powder|sauce|\bpaste\b|pickle|ketchup|flakes|seasoning|crisp|mayo|mayonnaise|chutney|\bdip\b|spread|marination|\bpapad\b|fryum|concentrate|essence|\bjuice\b|squash|sun.?dried|vathal/i;
  var spiceL=PROC.test(label)&&/masala|powder|sauce|paste|pickle|ketchup|flakes|seasoning/i.test(label);
  var meatL=/chicken|prawn|fish|mutton|meat/i.test(label);
  var poolc=/curd|dahi|yogurt|\bmilk\b|paneer|butter|ghee|bread|pav|egg|atta|rice|oil|chicken|fish|prawn|mutton|\bdals?\b|\blentils?\b/i.test(label);
  var TC=[/curd|dahi|yogurt|yoghurt|skyr/i,/\bmilk\b/i,/paneer/i,/butter/i,/\boil\b/i,/ghee/i,/bread|pav\b|\bsourdough\b|\bloaf\b|\bloaves\b|\bbaguettes?\b|\bbrioche\b|\bbuns?\b/i,/egg/i,/atta|wheat flour/i,/rice/i,/chicken/i,/fish|pomfret|basa|tilapia|salmon|sardine|mackerel|seer\b|surmai|anjal|rohu|catla/i,/prawn|shrimp/i,/mutton|lamb|goat/i,/\bmoong\b|\bmung\b|\bgreen gram\b/i,/\btoor\b|\btur\b|\barhar\b|\bpigeon pea\b/i,/\bchana dal\b|\bchanna dal\b|\bbengal gram\b|\bgram dal\b/i,/\bkabuli\b|\bchickpea\b|\bchhole\b|\bchole\b|\bgarbanzo\b/i,/\burad\b|\burd\b|\bblack gram\b/i,/\bmasoor\b|\bred lentil\b/i,/\bmatki\b|\bmoth bean\b/i,/\bkulthi\b|\bhorse gram\b/i];
  /* Rule 17b (11-Aug) — a bare commodity keyword must not match a row whose product CLASS is
     something else. Only applies when the LABEL itself is not that class. Narrow on purpose:
     'zero' alone would kill "Zero Maida Whole Wheat Bread", a real bread. */
  var NEGCLASS=/\bchips?\b|crisps|softgels?|capsules?|tablets?|antacid|electrolyte|namkeen|chivda|mixture|\bsev\b|wafer|biscuits?|cookies?|crackers?|candy|toffee|ice ?cream|kulfi|\bcake\b|muffin|pastry|\bsoda\b|\bcola\b|milkshake|\bbuns?\b|smoothie|supplement|\bpuffs?\b|puffed|muesli|granola|\bcereal\b|\bstarch\b|bhujia|nimki|murukku|chakli|chakali|farsan|gathiya|mathri|fryums|khakhra|\bwhey\b|plant protein|pea protein|protein (powder|concentrate|isolate|sachet)|protein bars?|\bale\b|kombucha|soft\s*drink|\bdropper\b|\bdispenser\b|\bsprayer\b|diffuser|for\s+plants|\bpotato\s*bites\b|hand\s*wash|handwash|grease\s*fighter|cough\s*drops?|\blozenges?\b|shower\s*gel|shampoo|\bdetergent\b|sanitiz|toothpaste|dishwash|\b(?:chilla|pancake|jamun|handvo|idiyappam|dosa|idli|upma|batter)\b(?:\s+\S+){0,3}\s*\bmix\b/i;
  var NEGFREE=/zero[- ]?sugar|sugar[- ]?free|salt[- ]?free|no added sugar/i;
  /* Rule 18f (11-Aug, Jayant) — a COOKING line (kadhi, marinade, moru, raita, curry) takes plain
     CURD only, never Greek yogurt / skyr / flavoured or spiced cups; an EATING line (oats, bowl,
     cup, muesli) takes yogurt only and never drains the cooking curd. */
  var COOKDISH=/kadhi|marinad|moru|raita|curry|gravy|tikka|biryani/i;
  var COOKUSE=/curd|dahi|kadhi|marinad|moru|raita|curry|gravy|tikka|biryani|\bcook/i;
  var EATUSE=/\boats\b|bowl|\bcup\b|parfait|granola|muesli|smoothie|breakfast|snack|dessert|as.is/i;
  var YOGEAT=/yogh?urt|skyr/i;
  var NOTCOOKCURD=/greek|skyr|blueberry|strawberry|mango|vanilla|flavou?r|spiced|chaas|\blassi\b/i;
  var FERMENT=/curd|dahi|yogh?urt|skyr/i, PLAINCURD=/curd|dahi/i;
  /* ===== Rule 17c/17d (11-Aug audit) =====
     17c DERIVED FORMS: seed / softgel / capsule / rub / cake / rava / kasuri never answer a call for
         the fresh or whole ingredient; a fat or condiment carrying an aromatic's name is not that
         aromatic (Garlic Butter was answering every garlic call); matar != lobia.
     17d PACKAGING NOTES: a parenthetical describing the packet — "(near empty, onion artwork)" —
         must not contribute match tokens. That one matched a rice pouch as ONION.
     Guards read the label HEAD (before the first '(' or ':') so prose in a label cannot disarm them. */
  var DERIV=/\bseeds?\b|\bsoftgels?\b|\bcapsules?\b|\btablets?\b|\brubs?\b|\bcakes?\b|\brava\b|\btari\b|\bpodi\b|\bchutney powder\b|\bkasuri\b/i,DERIV_NOTSEED=/\bsoftgels?\b|\bcapsules?\b|\btablets?\b|\brubs?\b|\bcakes?\b|\brava\b|\btari\b|\bpodi\b|\bchutney powder\b|\bkasuri\b/i,SEEDSPICE=/\bjeera\b|\bcumin\b|\bmustard\b|\brai\b|\bsasive\b|\bsaunf\b|\bfennel\b|\bajwain\b|\bcarom\b|\bkalonji\b|\bnigella\b|\bsesame\b|\btil\b|\bpoppy\b|\bkhus khus\b|\bcardamom\b|\belaichi\b/i;
  /* PARITY with matcher.py — the same exemption for a different class of food: GRAINS that are
     botanically seeds and are sold under either name. SEEDSPICE is written for spices and quinoa is
     not one, so it is said separately rather than smuggling a cereal into a list of spices.
     Measured across the 14 live households on 20-Aug: exactly SEVEN labels were blocked from stock
     whose name they contain, and six were the rule working — "Coriander (fresh)" must not be
     answered by 1014 g of Coriander Seeds, "Methi (fresh)" not by 122 g of Methi Seeds. The seventh
     was y21's "Quinoa" against 1000 g of Whole Farm Premium Quinoa Seeds: a kilo of the exact food,
     invisible because of a noun.
     Entry test, the same one SEEDSPICE states: the plain name refers to the seed itself, because the
     kitchen has no other form of it. AMARANTH, PUMPKIN and BASIL are pointedly absent and must stay
     absent — amaranth greens, pumpkin the vegetable and basil the herb all exist in these kitchens,
     so for those a seeds row really is not what was asked for. */
  var SEEDGRAIN=/\bquinoa\b|\bbuckwheat\b|\bkuttu\b|\bsabja\b|\bhalim\b/i;
  /* DERIV's alternatives one at a time — _sameForm needs to know WHICH derived word matched, not
     merely that one did. PARITY with matcher.DERIV_WORDS. */
  /* Rule 103's vocabulary, named so the twin-class test below can share it. NOT the same list as
     PP_DERIVED in expandKws: this one carries idli and dosa (rice varieties/derivatives) while that
     one carries semolina/suji/sooji. They answer different questions and matcher.py keeps them
     separate too — RICE_DERIV vs aliases.DERIVED. */
  var RICE_DERIV=/poha|flatten|puff|murmura|flour|noodle|batter|papad|vermicelli|\brava\b|\btari\b|\bcakes?\b|\bidli\b|\bdosa\b|\bsticks?\b|\bpaper\b|\bmix\b/i;
  var PP_DERIV_WORDS=[/\bseeds?\b/i,/\bsoftgels?\b/i,/\bcapsules?\b/i,/\btablets?\b/i,/\brubs?\b/i,/\bcakes?\b/i,/\brava\b/i,/\btari\b/i,/\bpodi\b/i,/\bkasuri\b|\bkasoori\b|\bqasuri\b|\bkasturi\s*methi\b/i];
  /* PARITY with matcher.py — lemon and lime join the list, and a DIP is one of the things they must
     not be satisfied by. y24 held 20 g of fresh Lemon and 110 g of expired "Lime & Jalapeno Hummus";
     the alias group let the hummus answer a lemon call, so one board read "Lemon 130 g expired" and
     another "20 g" fresh. A hummus is not a lemon, for the same reason Garlic Butter is not garlic. */
  /* UNANCHORED — see matcher.py's note. `^` let "Kaffir Lime Leaves" bypass the guard entirely. */
  var AROMA=/\b(onion|tomato|garlic|ginger|green chilli|coriander|mint|curry leaves|methi|palak|spinach|lemon|lime)/i;
  var AROMAX=/\bbutter\b|\boils?\b|\bghee\b|\bsauce\b|\bpaste\b|\bpowder\b|\bsalt\b|\bpickle\b|\bchutney\b|\bmasala\b|\bhummus\b|\bdips?\b|\bspread\b/i;
  /* BREAD IS NOT BREADCRUMBS — the twin of matcher.py's BREADLBL/BREADX (Jayant, 3-Sep:
     "bread and bread crumbs are diffrent"). Rule 66h refused the build when this line was
     missing here and present in Python, which is the gate working: y35's only bread-ish row
     is Bread Crumbs 425 g, and the two engines disagreed about whether it answers Bread. */
  var BREADLBL=/\b(bread|loaf|pav|bun|baguette|sourdough|brioche)\b/i;
  var BREADX=/\bcrumbs?\b|\bbreadcrumbs?\b|\bcrisps?\b|\brusks?\b/i;
  var QUALROW=[],QUALVEG=[/cherry\s*tomato|cocktail\s*tomato/i,/sweet\s*potato|shakarkandi|ratala/i,/baby\s*corn/i,/spring\s*onion|scallion/i,/raw\s*banana|plantain|kacch?a\s*kela/i],PEAX=[[/matar|green pea/i,/lobia|black.?eyed|cowpea|chana|chickpea|split pea/i],
            [/lobia|black.?eyed/i,/matar|green pea/i]];
  var PKG=/\b(jar|bag|pouch|packet|pack|box|bottle|tin|can|carton|sachet|shaker|tray|basket|punnet|net|glass|plastic|steel|mug|cup|artwork|empty|half|full|sealed|opened|part used|near|approx|blurry|loose|unopened|remaining|leftover)\b/i;
  var LH=String(label).split(/[(:]/)[0];
  /* HOISTED OUT OF THE PER-ROW LOOP, AND PLACED AFTER LH IS ASSIGNED. First attempt sat above the
     LH declaration, so both lists were computed against undefined, came out empty, and silently
     disabled BOTH guards — a cherry-tomato need went straight back to drawing on plain tomatoes. ppOkFactory is the hottest path here — ok() runs once per
     candidate row per label — and these two guards re-tested the LABEL for every row, though LH
     cannot change inside one factory. gate:uom went from minutes to a 10-minute timeout when a
     fifth QUALVEG entry and a QUALROW loop were added, and gate_boards already times out at 120s
     on the seven biggest households for the same reason: work here is paid ~360k times to build
     one shelf. Only patterns matching the label can reject on the QUALVEG side, and only
     patterns NOT matching it can reject on the QUALROW side, so both collapse to (usually)
     empty before a single row is examined. */
  var _QV_L=[],_QR_L=[],_qi,_ri;
  for(_qi=0;_qi<QUALVEG.length;_qi++){if(QUALVEG[_qi].test(LH))_QV_L.push(QUALVEG[_qi]);}
  for(_ri=0;_ri<QUALROW.length;_ri++){if(!QUALROW[_ri].test(LH))_QR_L.push(QUALROW[_ri]);}
  /* Rule 17f — SILENT SUBSTITUTIONS. Rule 18e allows paneer <-> firm tofu; it does NOT allow
     paneer -> mozzarella, coconut water for grated coconut, or a millet flour for wheat atta.
     All three happened with no (absent) flag, so nothing downstream knew. */
  /* PARITY with matcher.py (Rules 44/46). These two guards had been added to the pipeline engine
     only — that divergence is itself the bug class this app keeps hitting. A fresh-vegetable label
     may never take a dry pulse / coffee / cocoa SKU, and green peas (fresh or frozen matar) are not
     WHITE peas (dried safed matar). h9 stocks both. */
  var FRESHVEG=/mixed vegetab|fresh bean|french bean|green bean|cluster bean|salad veg|veg \(/i;
  var DRYBEAN=/\brajma\b|kidney bean|\bcoffee\b|\bcocoa\b|cacao|soya bean|soybean|black bean|chana|chickpea|kabuli|lobia|black[- ]eyed|baked bean/i;
  /* RULE 51 (parity with matcher.py): coconut FLESH is not a coconut derivative, and a flavoured
     condiment oil is not cooking fat. vs204 had coconut SUGAR drained to zero answering a grated-coconut
     call, and Sichuan chilli oil answering Oil/Ghee with 141 g cooking oil and 389 g ghee in the house. */
  var COCOFLESH=/^coconut(?!\s*(sugar|oil|water|milk|flour|vinegar|amino|butter|cream|jaggery))/i;
  var COCODERIV=/coconut\s*(sugar|jaggery|oil|water|flour|vinegar|amino|butter|cream)|(sugar|oil|water|flour|vinegar|amino|butter|cream)\s*coconut/i;
  /* A CORN DERIVATIVE IS NOT THE VEGETABLE (y22, 2-Sep). The sweet-corn family carries the bare
     keyword "corn", so a Sweet corn need pooled 395 g of expired corn FLOUR with 60 g of frozen
     sweet corn; the Smart list then read "N of M expired" for a commodity the dashboard cards as
     fresh and gate_boards (Rule 129) refused the build. Twin of matcher.ok; BOTH are generated
     from matcher.py by splice_only (Rule 66g), so neither can drift. */
  var CORNVEG=/\bcorn\b|\bbhutta\b|\bmakkai\b/i;
  var CORNDERIV=/\bcorn\s*(flour|meal|starch|syrup|flakes?|chips?)\b|\bcornflour\b|\bcornmeal\b|\bcornstarch\b|\bcorn\s*silk\b|\bpopcorn\b|\bcornito/i;
  /* RULE 179 (9-Sep, his ruling) — maize flour is ONE food and a FLOUR need reaches it under
     either of its names. GENERATED from matcher.MAIZEFLOURROW / matcher.FLOURLBL, like every
     other row guard, so the vernacular list cannot drift between the two engines. */
  var MAIZEFLOURROW=/\b(?:makk?a|makk?ai|makk?i|maize)\b[^,;]{0,20}?\b(?:atta|flour|meal)\b|\bcorn\s*meal\b|\bcornmeal\b/i;
  var FLOURLBL=/\b(?:flour|atta|meal)\b/i;
  var BABYCORN=/\bbaby\s*corn\b/i;
  var FATLBL=/^(oil|ghee|oil\/ghee|cooking oil|butter|fat)\b/i;
  /* RULE 176c — generated from matcher.MAYOSAUCE by splice_only, NOT hand-typed: CONDOIL beside it is hand-typed and that is exactly the divergence Rule 66h keeps catching. */var MAYOSAUCE=/\bmayo\w*|\bketchup\b|\bdressing\b|\bdips?\b|\bspreads?\b|\bcrisp\b/i;
  var CONDOIL=/chill?i oil|chilli[- ]?crisp|truffle oil|garlic oil|infused oil|essential oil|hair oil|massage oil|body oil|schezwan|sichuan/i;
  var BEVROW=/\b(?:coffee|tea)\b(?:\s+(?:powders?|granules?|bags?|sachets?|premix|mix|pack))?\s*$/i;
  var INSTANTBRAND=/\bmaggi\b/i;
  var PREPLBL=/\b(ketchup|sauce|noodles?|soup|bouillon|stock\s*cubes?|pasta)\b/i;
  var BEVLBL=/\b(?:coffee|tea|chai|latte|cappuccino|espresso|decoction)\b/i;
  var SPROUTW=/\bsprouts?\b/i;
  var SPROUTOK=/\bsprouts?\b|\bsprouted\b/i;
  /* RULE 167 twin of matcher.ok — Rule 51's condiment-oil refusal, extended to labels that NAME an
     oil. Declared HERE, beside FATLBL/CONDOIL, because ppOk reads all three and a constant declared
     in another scope reads as undefined and throws (the GROUND_ONLY lesson). PLACEHOLDER:
     splice_only.py generates the real pattern from matcher.OILWORD at bake time and refuses the
     build if it cannot find this line. */
  var OILWORD=/\boils?\b/i;
  /* RULE 168 twin of matcher.ok — a vinegar need takes only vinegar, and never what is pickled in
     it. y28's "Rice Vinegar" pointed at 4,132 g of plain Rice; y36's "Vinegar" took a jar of
     Abbie's Sliced Jalapeños in Vinegar while two real white vinegars sat beside it. PLACEHOLDERS,
     generated by splice_only.py from matcher.VINLBL / matcher.PRESERVEDIN. */
  var VINLBL=/\bvinegars?\b/i;
  var PRESERVEDIN=/\bin\s+(vinegar|brine|syrup)\b/i;
  /* RULE 169 twin of matcher.ok — a peri-peri SEASONING BLEND is not the food it is flavoured with.
     His ruling, 8-Sep: y28's Cheese must not take "The Only Piri Piri Cheese Mix" (135 g, GREEN)
     while their Amul slices and parmesan sat beside it. BOTH tests are on the ROW, because the
     flavour word alone does not make a product a spice — this ledger's peri-peri prawns, tempeh and
     chicken genuinely ARE those foods. PLACEHOLDERS, generated by splice_only.py. */
  /* RULES 170-172 twins of matcher.ok, found by the first POOL-LEVEL audit (Jayant: "every hh has
     wrong mapping"). `--via` names only the ONE row a need resolved to, so a wrong row sitting
     BESIDE a correct one in the same pool was invisible to it; enumerating all 1,989 accepted
     (need, row) pairs is what surfaced these. PLACEHOLDERS, generated by splice_only.py.
       170  a SEED need is not the fresh LEAF, for the plants whose leaf is its own food. NOT for
            mustard/jeera/saunf, where Rule 105 says the seed IS the spice and a bare "Organic Black
            Mustard" row must go on answering a "Mustard seeds" need (measured: y26 73 g, y09 46 g).
       171  a flavoured dairy tub is not the fruit on its label - the protein-tub rule in NEGCLASS,
            applied to the dairy aisle. y28 Blueberries -> "Epigamia Greek Yogurt (Blueberry)".
       172  green/herbal tea is not black tea leaves. y28 "Tea leaves" -> Lipton Green Tea;
            y14's "Tea leaves" -> "Tea" (496 g) is correct and untouched. */
  /* RULE 173 family twins of matcher.ok — found by reading all 1,258 distinct (label -> row) pairs
     the boards hold, after Jayant: "every hh has wrong mapping". PLACEHOLDERS, generated by
     splice_only.py from matcher.VARIANTROW / matcher.SEEDROW. Same shape as MAIZEF and CORNDERIV:
     the ROW carries a word that changes the FOOD, and each entry is disarmed by a label naming the
     variant itself, so a "Sweet potato" need still finds sweet potato. */
  var PP_VARIANTROW=[[/\bice\s*apple\b|\btaati\b|\bnungu\b|\bningu\b/i,"x"],[/\braw\s*banana\b|\bbaalekaayi\b|\bbalekayi\b|\bplantain\b/i,"x"],[/\bsweet\s*potato\b|\bgenasu\b|\bshakarkandi\b/i,"x"],[/\bwhite\s*pepper\b/i,"x"],[/\bjalapen[o0]\w*/i,"x"],[/\bblack\s*cardamom\b|\bbadi\s*elaichi\b/i,"x"],[/\bkalonji\b|\bnigella\b|\bblack\s*cumin\b|\bkala\s*jeera\b/i,"x"],[/\bblack\s*turmeric\b/i,"x"],[/\bfish\s*tamarind\b|\bkudam?puli\b|\bkodam?puli\b/i,"x"],[/\bcowpea\b|\bkaramani\b|\blobia\b|\bblack.?eyed\b/i,"x"],[/\bnutritional\s*yeast\b|\bnooch\b/i,"x"],[/\bcurd\s*chill?ie?s?\b|\bmor\s*milaga[iy]\b|\bdahi\s*mirch\b/i,"x"]];
  var PP_BERRYNAMES=[[/\bblueberr\w*/i,"blueberry"],[/\bstrawberr\w*/i,"strawberry"],[/\bblackberr\w*/i,"blackberry"],[/\braspberr\w*/i,"raspberry"],[/\bcranberr\w*/i,"cranberry"],[/\bmulberr\w*/i,"mulberry"]];
  /* RULE 178 (9-Sep, his ruling) — the named-oil table, GENERATED from matcher.OILNAMES for the
     same reason PP_BERRYNAMES and PP_VARIANTROW are: the next oil goes in on the Python side and
     a hand-typed browser copy would go on pooling it. Rule 66h is what proves the two agree. */
  var PP_OILNAMES=[[/\bsesames?\b|\bgingell?y\b|\btil\b/i,"sesame"],[/\bcoconut\b|\bnariyal\b|\bkopra\b/i,"coconut"],[/\bmustard\b|\bsarson\b|\brai\b|\bkachi\s*ghani\b/i,"mustard"],[/\bolives?\b/i,"olive"],[/\bgroundnuts?\b|\bpeanuts?\b|\bmoongphali\b/i,"groundnut"],[/\bsunflowers?\b/i,"sunflower"],[/\bcanola\b|\bconola\b|\brapeseed\b/i,"canola"],[/\brice\s*bran\b/i,"ricebran"],[/\bsoya?\b|\bsoybeans?\b/i,"soy"],[/\bpalm\b/i,"palm"],[/\balmonds?\b|\bbadam\b/i,"almond"],[/\bwalnuts?\b/i,"walnut"],[/\bflax\w*\b|\balsi\b/i,"flax"],[/\bavocado\b/i,"avocado"],[/\bcastor\b|\barandi\b/i,"castor"]];
  var DRYX=/\bdry\b|\bdried\b|dehydrated/i;
  var DRYX_LBL=/\bdry\b|\bdried\b|dehydrated|\bkasuri\b|\bkasoori\b|\bqasuri\b|\bkasturi\s*methi\b/i;
  var SEEDROW=/\bseeds?\b|\bwhole\b(?!\s+farm)/i;
  /* RULE 173m twin: the same FORM is not the same FOOD. Rule 152 refused a preflight over ok('Chilli flakes','Rice Flakes')==true - both declare 'flakes' and nothing compared the food. PLACEHOLDER, generated from matcher.GRAINROW. */
  var GRAINROW=/\brice\b|\bwheat\b|\bragi\b|\bjowar\b|\bbajra\b|\boats?\b|\bpoha\b|\bflattened\b|\bavalakki\b/i;
  /* RULE 176 twin: a peppercorn need is not a chilli and not a cereal. PLACEHOLDERS, both generated
     from matcher.PEPPERCORN by splice_only — the _G form is the /gi copy String.replace needs. */
  /* from newplan.HOUSEHOLDS by splice_only — the 17-Sep pilot's four households. */
  var PP_PILOT={"y26": 1, "y31": 1, "y32": 1, "y40": 1};
  var PEPPERCORN=/\bblack\s*pepper\b|\bkaa?li\s*mirch\b|\bpeppercorns?\b/i;var PEPPERCORN_G=/\bblack\s*pepper\b|\bkaa?li\s*mirch\b|\bpeppercorns?\b/ig;
  /* RULE 177 twin: a powder that reconstitutes into the liquid the label names. [rowRx,labelRx]
     pairs, BOTH must match. PLACEHOLDER, generated from matcher.RECONSTITUTES by splice_only. */
  var PP_RECONSTITUTES=[[/\bcoconut\s*milk\s*powder\b/i,/\bcoconut\s*milk\b/i],[/\btamarind\s*(paste|concentrate)\b/i,/\btamarind\b/i],[/\bvanilla\s*(bean\s*)?paste\b/i,/\bvanilla\b/i]];
  var SEEDLBL=/\bseeds?\b|\bmethi\s*dana\b/i;
  var SEEDLEAF=/\bcoriander\b|\bdhania\b|\bcilantro\b|\bkothimbir\b|\bmethi\b|\bfenugreek\b/i;
  var FRUITLBL=/\bblueberr\w*|\bstrawberr\w*|\braspberr\w*|\bblackberr\w*|\bberries\b|\bberry\b|\bmango(es)?\b|\bbanana\b|\bapples?\b|\boranges?\b|\bpomegranates?\b|\bgrapes?\b|\bpapaya\b|\bpineapple\b|\bpeach\w*|\bcherr\w*/i;
  var DAIRYTUB=/yogh?urt|\bskyr\b|shrikhand|\blassi\b|ice ?cream|milkshake|smoothie/i;
  var TEALBL=/\btea\b/i;
  var GREENTEA=/\bgreen\s*tea\b|\bherbal\s*tea\b|\bchamomile\b|\bmatcha\b|\boolong\b/i;
  var PIRIPIRI=/\bpiri\s*-?\s*piri\b|\bperi\s*-?\s*peri\b/i;
  var SEASONROW=/\bseasonings?\b|\bsprinklers?\b|\bspice\s*mix\b|\bmix\b/i;
  /* RULE 183 — a seasoning blend is not the starch it seasons. BOTH are PLACEHOLDERS,
     generated from matcher.STARCHLBL / matcher.SEASONMIX by splice_only. */
  var STARCHLBL=/\b(pasta|pizza|noodles?|spaghetti|macaroni|penne|fusilli|farfalle|vermicelli|lasagne|lasagna)\b/i;
  var SEASONMIX=/\bseasonings?\b|\bsprinklers?\b|\bspice\s*mix\b/i;
  /* The butter QUALIFIER table, now GENERATED from matcher.BUTQ. It was hand-typed inline inside
     ppOkFactory and 8-Sep is the day that cost something: 'kokum' was added to the Python list
     because y31's plain Butter need was taking Raw Kokum Butter (a chocolate/skincare fat) while
     their only real butter sat at 0 g, and a hand-typed browser copy would have gone on saying
     GREEN. Same lesson as MAIZEF and GROUND_ONLY. */
  var BUTQ=/(peanut|cocoa|almond|cashew|choco|kokum)/i;
  /* RULE 54 (parity with matcher.py): a declared FORM must match. "Red chilli powder" was answered
     by a chilli SAUCE and chilli FLAKES because the alias group collapses every chilli product into
     one word. The word is shared; the thing is not. */
  var PP_FORMS=[['powder',/\bpowders?\b|\bground\b/i],['flakes',/\bflakes?\b|\bcrushed\b/i],['sauce',/\bsauce\b|\bketchup\b|\bsriracha\b|\bdip\b/i],['paste',/\bpaste\b|\bpuree\b/i],['oil',/\boils?\b/i],['pickle',/\bpickles?\b|\bachar\b/i],['chutney',/\bchutney\b/i],['seeds',/\bseeds?\b/i],['syrup',/\bsyrup\b|\bsugar\b|\bjaggery\b|\bhoney\b/i],['vinegar',/\bvinegar\b/i],['juice',/\bjuice\b|\bsquash\b|\bconcentrate\b/i],['milk',/\bmilk\b/i],['dried',/\bdried\b|\bdry\b|\bdehydrated\b|\bsun.?dried\b|\bkasuri\b|\bkasoori\b|\bqasuri\b|\bkasurimethi\b|\bkasturi\s*methi\b/i],['fresh',/\bfresh\b/i]];
  function ppFormOf(t){t=String(t||'');for(var i=0;i<PP_FORMS.length;i++){if(PP_FORMS[i][1].test(t))return PP_FORMS[i][0];}return null;}
        var FORM_EXEMPT_LABEL=/^\s*(turmeric|haldi|hing|asafoetida|amchur|dry mango|oregano|vanilla|black pepper|garam masala|corn\s*starch)\b/i;   var PROCESSED_FORMS={chutney:1,dried:1,flakes:1,juice:1,milk:1,oil:1,paste:1,pickle:1,powder:1,sauce:1,syrup:1,vinegar:1};   var ALWAYS_PROCESSED=/\bbay\s*leaf|\btej\s*patta\b|\bkasuri\b|\bkasoori\b|\btamarind\b|\bimli\b|\byeast\b/i;   var BLACKSALT=/\bblack\s*salt\b|\bkala\s*namak\b/i;
   var MAIZEF=/\bmakai\b|\bmakka\b|\bmaize\b|\bcorn\s*flour\b|\bcornmeal\b|\bmakki\b/i;
   var ONIONW=/\bshallots|\bshallot|\beerulli|\birulli|\bonion|\bpyaaz|\bkanda|\bpyaz/i;
   var FLOWERROW=/\bflowers?\b|\bblossom\b/i;   var NUTTY=/\bpeanut|\bgroundnut|\bmoongphali|\balmond|\bcashew|\bhazelnut|\bpistachio/i;   var SWEETLIME=/mosambi|musambi|mausambi|mosambe|sweet\s*lime|sweet\s*lemon/i;var SWEETLIME_G=/mosambi|musambi|mausambi|mosambe|sweet\s*lime|sweet\s*lemon/ig;var SOURCITRUS=/\blemon|\blimes?\b|nimbu|nimboo|nimbe/i;var ORANGEAS=/\boranges?\b/i;var ORANGEMOD=/\boranges?\s+(?:kashmiri\ red\ chilli|dried\ red\ chillies|hasiru\ soutekaayi|red\ chilli\ dried|whole\ red\ chilli|red\ chilli\ whole|red\ chilly\ whole|red\ chilli\ sauce|dried\ red\ chilli|bili\ hurulikaayi|black\ eyed\ peas|black\-eyed\ peas|dried\ red\ chill|whipping\ cream|roasted\ channa|tomato\ ketchup|dry\ red\ chilli|protein\ powder|tender\ coconut|sambhar\ masala|chickpea\ flour|dried\ chillies|flattened\ rice|byadgi\ chilli|haricot\ beans|pepper\ powder|coconut\ water|plant\ protein|american\ corn|italian\ basil|chana\ \(kabuli|cooking\ cream|lady's\ finger|roasted\ chana|kabuli\ channa|sambar\ masala|greek\ yogurt|kabuli\ chana|curry\ leaves|roasted\ gram|shimla\ mirch|bottle\ gourd|dried\ chilli|eggless\ mayo|chaat\ masala|green\ chilli|black\ pepper|chilli\ sauce|basil\ leaves|thenginakayi|haricot\ bean|french\ beans|pearl\ millet|chat\ masala|fresh\ cream|pomegranate|lady\ finger|patta\ gobhi|bell\ pepper|sowthekaayi|heavy\ cream|hurulikaayi|cauliflower|fresh\ basil|white\ chana|kidney\ bean|sweet\ basil|cooking\ oil|brown\ chana|dairy\ cream|poppy\ seeds|kala\ channa|french\ bean|wheat\ flour|black\ chana|kaali\ mirch|laal\ mirch|soya\ sauce|soutekaayi|gram\ flour|vermicelli|hari\ mirch|red\ chilli|sweet\ corn|degi\ mirch|peppercorn|green\ peas|asafoetida|kala\ chana|green\ gram|dry\ chilli|moongphali|mayonnaise|black\ gram|fried\ gram|ragi\ flour|buttermilk|desi\ chana|red\ lentil|lal\ mirchi|kali\ mirch|sowtekaayi|red\ chilly|ladyfinger|kadi\ patta|blackberry|hurulikayi|strawberry|chukandar|blueberry|fenugreek|seer\ fish|cashewnut|drumstick|coriander|soy\ sauce|hung\ curd|arhar\ dal|khus\ khus|mayonaise|groundnut|pistachio|lal\ mirch|chickpeas|kothimbir|aubergine|tej\ patta|hot\ sauce|uht\ cream|ragi\ atta|bay\ leaf|tamarind|dalchini|tejpatta|semolina|avalakki|corn\ cob|toor\ dal|cucumber|chickpea|cinnamon|eggplant|kalaunji|karibevu|cardamom|tej\ pata|beetroot|cilantro|capsicum|khuskhus|shallots|kishmish|bellulli|turmeric|nuggekai|mackerel|mustard|elaichi|cabbage|sardine|nigella|eerulli|elaneer|kasturi|coconut|byadagi|moringa|sambaar|nariyal|baingan|sambhar|spinach|brinjal|pomfret|majjige|yellaki|javitri|tamatar|yelakki|jaggery|raisins|sorekai|kasoori|yoghurt|tur\ dal|kalonji|berries|shallot|seviyan|ketchup|tilapia|shrimp|machli|ginger|batata|chilli|cowpea|garlic|mirchi|carrot|byadgi|masoor|dhania|irulli|fennel|salmon|pudina|sarson|cashew|surmai|bhindi|tomato|bhutta|jhinga|lehsun|shunti|chawal|sambar|kasuri|semiya|ajwain|peanut|chilly|elakki|qasuri|kheera|sesame|lavang|chhole|potato|makkai|yogurt|raisin|lobia|methi|malai|mirch|matar|cream|adrak|clove|saunf|nimbu|prawn|basil|laung|bajra|sooji|pista|palak|chaas|nimbe|chili|carom|rajma|gajar|anjal|arhar|gobhi|kanda|lemon|tuppa|besan|chole|jeera|bread|pyaaz|cumin|onion|haldi|moong|lauki|imli|daal|gobi|mace|whey|ellu|skyr|atta|corn|okra|rava|aloo|lime|dahi|basa|urad|curd|pyaz|rice|eggs|fish|anda|beed|akki|mayo|meen|suji|ghee|anar|peas|mint|hing|mung|poha|toor|kaju)/i;var FRUITCLS=/\bfruits?\b/i;var CONFECT=/\bchocolates?\b|\bgumm(?:y|ies)\b|\btoffees?\b|\bcand(?:y|ies)\b|\blollipops?\b|\bnougat\b|\bpralines?\b|\bjams?\b|\bmarmalades?\b|\bconserves?\b|\bfruit\s*spread\b|\bjell(?:y|ies)\b|\bpreserves?\b|\bcompotes?\b/i;var GREENPEA=/green pea|matar|frozen pea/i;
/* RULE 153 vocabularies — spliced from matcher.py; /x^/i is a never-matching placeholder. */
var CHILLIFOOD=/chill?[iy]|mirchi|\bmirch\b/i;var CHILGREEN=/\bgreen\b|\bhari\b/i;var CHILRED=/\bred\b|\bdried\b|\bdry\b|\blal\b|\blaal\b|\bdegi\b|kashmiri|byadgi|byadagi|guntur/i;
/* RULE 154 — spliced from matcher.py. */
var MIXPACK=/mixed pack|\s\+\s|\bjar set\b|\bspice set\b|\bgift set\b|\bcombo\b/i;var MIXLBL=/mixed|\bmix\b|assorted|\bjar set\b|\bspice set\b|\bgift set\b|\bcombo\b|\bpack\b|\s\+\s/i;var DISHROW=/\b(noodles?|ramen|biryani|pulao|khichdi|upma|dosa|uttapam|samosa|momos?|nuggets?|shotz|fries|popcorn|namkeen|bhujia|sev|cookies?|biscuits?|rusk|cake|pastry|muffin|burger|sandwich|patty|patties|bread|sausages?|salami|ham|kebabs?|tikki|cutlets?|soup|halwa|laddoo|laddu|barfi|jalebi|ice\s*cream|kulfi|custard|pudding|vada|bonda|paratha|spring\s*roll|fry|roast|tikka|manchurian|thoran|poriyal|bhaji|sab[zj]i|gravy|65|korma|olives?(?!\s*(oil|pomace))|makhana|phool\s*makhana)\b|\brice\s*$/i;var DISHLBL=/\b(noodles?|ramen|biryani|pulao|khichdi|upma|dosa|uttapam|samosa|momos?|nuggets?|shotz|fries|popcorn|namkeen|bhujia|sev|cookies?|biscuits?|rusk|cake|pastry|muffin|burger|sandwich|patty|patties|bread|sausages?|salami|ham|kebabs?|tikki|cutlets?|soup|halwa|laddoo|laddu|barfi|jalebi|ice\s*cream|kulfi|custard|pudding|vada|bonda|paratha|spring\s*roll|fry|roast|tikka|manchurian|thoran|poriyal|bhaji|sab[zj]i|gravy|65|korma|olives?(?!\s*(oil|pomace))|makhana|phool\s*makhana|rice)\b/i;var BUTCHERCUT=/\bcut\b|\bkeema\b|\bmince[d]?\b|\bboneless\b|\bcurry\s*cut\b/i;var PETFOOD=/\bsheba\b|\bpedigree\b|\bwhiskas\b|\bdrools\b|\broyal\s*canin\b|\bpurina\b|\bfelix\b|\btemptations\b|\bfarmina\b|\borijen\b|\bacana\b|\bkibble\b|\b(cat|dog|kitten|puppy|pet)\s*(food|treats?|biscuits?|chow)\b/i;var CREAMLBL=/\b(cream|malai)\b/i;var NOTCREAM=/\bpaneer\b|\bcheese\b|\btartar\b|\bkhoya\b|\bcreamer\b|\bice[-\s]*creams?\b|\bkulfis?\b/i;var ICECREAM=/\bice[-\s]*creams?\b|\bkulfis?\b|\bgelato\b|\bfrozen\s*dessert\b|\bsoft\s*serve\b/i;var PAVFOOD=/\bpavs?\b|\bladi\s*pav\b|\bbuns?\b/i;var LOAFFOOD=/\bbreads?\b|\bloaf\b|\bloaves\b|\bbaguettes?\b|\bsourdough\b|\bbaguette\b/i;
  var WHITEPEA=/white pea|pea[s]?\W+white|safed matar|dried pea|pea[s]?\W+dried|yellow pea|marrowfat|blue pea|butterfly pea/i;
  /* Rule 17g — green capsicum vs red/yellow bell pepper. All four are GENERATED from matcher.py by
     splice_only.py (Rule 66g), so do not hand-edit them here: the build refuses if a site is missing,
     and the whole point of 66g is that this copy can never drift from the Python one again. */
  var CAPFOOD=/capsicum|bell\s*pepper|shimla\s*mirch/i;
  var CAPGREEN=/\bgreen\b/i;
  var CAPWARM=/\b(red|yellow|orange)\b/i;
  var CAPMIX=/tri[\s-]?colou?r|assorted|mixed/i;
  var CAPCHILLI=/chill?[iy]|mirchi|\bmirch\b|jalapeno|byadgi|guntur|paprika|cayenne|\bpepperoncini\b|bird[\s-]?eye/i;
  var SUBX=[[/\bpaneer\b/i,/mozzarella|cheddar|processed cheese|cheese (block|slice)|\bcheese\b/i],[/coconut(?!\s*(milk|water|oil))/i,/coconut water|tender coconut/i],[/coconut milk/i,/coconut water|tender coconut/i],[/\batta\b|wheat flour/i,/\bjowar\b|\bbajra\b|\bragi\b|(?<!with )(?<!and )(?<!\+ )(?<!& )millet|\bbesan\b|rice flour|(?<!zero )(?<!0% )(?<!0%)(?<!no )\bmaida\b(?![- ]?free)/i],[/\bmaida\b|refined (wheat )?flour/i,/\batta\b|whole ?wheat/i],[/\bwhey\b/i,/plant protein|pea protein|soy protein|vegan protein/i],[/plant protein|pea protein|vegan protein/i,/\bwhey\b/i],[/\bmilk\b/i,/almond beverage|almond milk|oat milk|soy milk/i]];
  return function(it){var n=ppPkgStrip(it.n).replace(/\s*\bbreakfast\s+cereals?\s*$/i,'').toLowerCase();/* RULE 150b twin of matcher.CATSUFFIX */
    if(FRESHVEG.test(LH)&&DRYBEAN.test(n))return false;var _lf=ppFormOf(LH),_nf=ppFormOf(n);var _rec0=false,_ri0;for(_ri0=0;_ri0<PP_RECONSTITUTES.length;_ri0++){if(PP_RECONSTITUTES[_ri0][0].test(n)&&PP_RECONSTITUTES[_ri0][1].test(LH)){_rec0=true;break;}}if(_lf&&_nf&&_lf!==_nf&&!_rec0)return false;/* RULE 177 disarms this for a powder that reconstitutes into the named liquid - label form 'milk' vs row form 'powder'. *//* A BARE FOOD NAME MEANS THE PLAIN FOOD. The check above only fires when BOTH sides declare a form, so "Green Chilli" reached "Chilli Powder" and "Apple" reached "Apple Cider Vinegar". Reads the FULL label, not LH, so a row still matches ITSELF when its form word sits after a parenthesis ("Everest Cumin (Jeera) Powder"). GROUND_ONLY (turmeric, hing) and ALWAYS_PROCESSED (bay leaf, tamarind) are exempt — there the processed form IS the product. Python twin in matcher.py; Rule 66h is what proves these two agree. *//* RULE 194 twin of matcher.ok: A PARENTHESISED QUALIFIER IS NOT A DECLARED FORM. y27's `Rice (dry)` pooled 40 ml of Rice Vinegar and y22's pooled BOTH its bottles - 614.8 ml, every gram of "rice" that household had - while the bare `Rice` label correctly refused them. ppFormOf read the RAW label, so a form word inside the brackets disarmed the bare-food-name rule. THE PARENTHETICAL STILL COUNTS WHEN IT AGREES WITH THE ROW'S OWN FORM, which is what keeps every row matching ITSELF - the first draft stripped it outright and Rule 66h caught five rows losing their self-match (Nutrimix (Kids Drink Powder), Sambal Oelek (Chilli Paste), Lemoneez (Lemon Juice Concentrate), Salsa (Dip-Spread-Relish), vs204 Snack Shelf). Python twin: matcher.ok, Rule 194. */var _lfo=_lf||ppFormOf(String(label).replace(/\([^)]*\)/g," "));var _lfr=ppFormOf(String(label));var _lff=_lfo||(_lfr===_nf?_lfr:null);if(_nf&&!_lff&&PROCESSED_FORMS[_nf]&&!FORM_EXEMPT_LABEL.test(LH)&&!ALWAYS_PROCESSED.test(n))return false;if(COCOFLESH.test(LH)&&COCODERIV.test(n))return false;/* 6-Sep: widened to match matcher.ok — a corn DERIVATIVE is only answered by a label that names one. The old form fired only for a corn-ish LABEL, so once the corn alias group widened keywords a generic label reached the flour. Measured: keeps y16/y09 'Corn starch', kills y22's Butter->Butter Popcorn. *//* RULE 179 twin of matcher.ok: MAIZE FLOUR IS ONE FOOD. A bare Flour need reached y32's "Makai Atta" (462 g) and was refused y35's "Makka Flour (Cornmeal)" (920 g) — the same food, opposite verdicts, on a household whose generic Flour need already pools ragi, bajra, singara and rice flour. Two deliberate rules were colliding: MAIZEF is keyed on an atta/wheat LABEL so a bare Flour label sails past it, while CORNDERIV refuses a generic label a corn derivative and only one of the two rows happens to spell it `cornmeal`. It also broke the MISS direction outright — ok('Maize flour','Makka Flour (Cornmeal)') was FALSE, because the label says maize and CORNDERIV only knows corn. NARROW ON PURPOSE: in India a packet reading "Corn Flour" is usually CORNSTARCH (y32 holds a Weikfield Corn Flour), so MAIZEFLOURROW matches only the vernacular maize words in front of a flour word, plus `cornmeal` itself — corn flour, corn flakes, corn starch, corn syrup, corn chips and popcorn all stay refused, and MAIZEF still keeps wheat and maize apart in both directions on its own. */if(CORNDERIV.test(n)&&!CORNDERIV.test(LH)&&!(MAIZEFLOURROW.test(n)&&FLOURLBL.test(LH)))return false;if(CORNVEG.test(LH)&&!BABYCORN.test(LH)&&BABYCORN.test(n))return false;if(BABYCORN.test(LH)&&CORNVEG.test(n)&&!BABYCORN.test(n))return false;if(FATLBL.test(LH)&&CONDOIL.test(n))return false;/* RULE 204 twin of matcher.ok: A BREWED DRINK IS NOT THE FOOD ITS FLAVOUR IS NAMED AFTER. Found by the 14-Sep 18:00 walk: y43's Eggs need (2 pcs) pooled their real Eggs row AND a 100 g jar of "Instant Egg Coffee", GREEN and live - the "different PRODUCT whose name merely contains the food word" shape on a class no guard reached. NOT a NEGCLASS entry, deliberately: that row IS food, it is a coffee, and it correctly answers a Coffee need - declaring it non-food would refuse the one call it serves and invite someone to baseline the refusal that created, which is the pizza-pasta-oregano mistake Rule 183 records. So it is DIRECTIONAL and disarmed by a beverage label, like 164/165/171/183. MEASURED WITH resolve() OVER EVERY LIVE SHELF, never ok(): of 1,886 accepted pairs it removes EXACTLY THREE - y43 Eggs -> Instant Egg Coffee (100 g), y43 Lemon -> Nestea Lemon Flavoured Ice Tea (236 g), y43 Salt -> Instant Salt Coffee (120 g) - and keeps all four real ones (y31 Tea leaves -> Khetl Blue Butterfly Tea, y41 and y44 Coffee -> their coffees). The soak found the Nestea and the salt coffee, which the walk had not named; the 14-Sep 14:00 note had recorded the salt pair as True "but NOT live", and it IS live now because y43 stocked the jar - a latent pair is not a safe pair, it is a live one waiting for a delivery. BEVROW anchors on the HEAD NOUN so "Tea masala" (head: masala) is untouched. Python twin: matcher.ok, Rule 204. */if(BEVROW.test(n)&&!BEVLBL.test(LH))return false;/* RULE 206 twin of matcher.ok: A BRANDED INSTANT PRODUCT IS THE FOOD ITS HEAD NOUN NAMES AND NOTHING ELSE. Found by Rule 175, which had it in `outstanding` and NOT in `accepted`: y27 holds 50 g of "Maggi Hot and Sweet Ketchup" and a bare Ketchup need read not-available. THE CAUSE WAS `\bmaggi\b` IN NEGCLASS, added 8-Sep to stop y40's Garlic need pooling "Maggi Spicy Garlic" (50 g, inside the garlic commodity) - and NEGCLASS means "this row is not food at all", so it refused ALL 18 Maggi rows for EVERY label. It was hiding 816 g of ketchup across seven households and 1,061 g of noodles across three to protect one row. Same mistake as the pizza-pasta entry Rule 183 records, on a different brand word, and DISHROW's note had already reasoned its way to the right answer - it keeps `maggi` out of that closed list "because it is the brand on a ketchup" - and it was put into the broader instrument anyway. So the guard is DIRECTIONAL: a Maggi row is refused for a label that is not itself a PREPARED-FOOD word. `masala` is deliberately NOT in PREPLBL and that was MEASURED: adding it lets Garam masala, Chaat masala AND Sambar masala all reach "Masala-ae-Magic" - one blend eating another, the shape Rule 152 refuses for y21|Chaat masala. MEASURED WITH resolve() OVER EVERY LIVE SHELF, BOTH STATES IN ONE PROCESS AGAINST ONE SNAPSHOT (two runs minutes apart had a peer write S4.xlsx in between, and a shelf change showed up looking like a matcher change): live Maggi pairs 0 -> 4, nothing lost - y27, y37 and vs204 Tomato Ketchup reach their ketchup and y25 Red Chilli Sauce reaches its sauce. The seven masala-sachet rows and y40 Spicy Garlic then became food nothing names, 8 NEW Rule 115i rows, baselined with their reasoning: resolve() finds them equally unspendable BEFORE the change, so nothing that could be spent has stopped being spendable. Python twin: matcher.ok, Rule 206. */if(INSTANTBRAND.test(n)&&!PREPLBL.test(LH))return false;/* RULE 205 twin of matcher.ok: SPROUTS ARE THEIR OWN FOOD, IN BOTH DIRECTIONS. y35's Sprouts need read GREEN on Moong Dal (760 g) and Moong Hara (250 g) - two DRY PULSES - which is the dangerous direction: a cook told they hold sprouts when the shelf holds dal that takes a day and a half to become sprouts. THE EVIDENCE IS THE LEDGER'S OWN: Master FnV carries "Green moong sprouts" as its own commodity classed Vegetable; Order Events show sprouts BEING BOUGHT as a product across households (Green Moong Sprouts, Moong Sprouts by Urban Harvest, Mixed Sprouts, Brown Chana Sprouts); and the Recipe Master distinguishes them itself - Chickpea Sprout Bowl prices raw "Chickpeas" while Moong Sprout Cucumber Bowl prices "Sprouts", so the label is deliberate. SYMMETRIC like Rules 192/193, because y22's Green Moong Dal need was taking 115 g of Moong Sprouts by Urban Harvest - the same error with label and row swapped. THE ARMING WORD IS THE NOUN sprout(s), NEVER the adjective "sprouted": "Sprouted Kodo Millet Flakes" IS millet. Measured with resolve() over 1,885 live pairs: removes exactly those three, adds none. y35 now correctly reads ABSENT. Python twin: matcher.ok, Rule 205. */if(SPROUTW.test(LH)&&!SPROUTOK.test(n))return false;if(SPROUTW.test(n)&&!SPROUTOK.test(String(label)))return false;/* RULE 167 twin of matcher.ok: Rule 51's refusal extended to a label that NAMES an oil. y33's "Olive oil" for a grilled chicken salad bowl resolved to Master Chow Chilli Oil — 2 ml of a Sichuan condiment as a salad dressing — because FATLBL above only matches a GENERIC label ("Oil", "Cooking oil", "Oil/Ghee") and a named oil is not generic. Scoped to oil labels deliberately: CONDOIL also carries 'sichuan', and the bare CORNDERIV-style form would quietly stop a Black pepper need reaching a "Sichuan peppercorn" row. The larger half — a named oil taking a DIFFERENT named oil — IS now guarded, as Rule 178 below; he ruled on it on 9-Sep ("fix and finish it") and the match_tests MUST case that had blocked it was MOVED to MUST_NOT rather than deleted. */if(OILWORD.test(LH)&&CONDOIL.test(n)&&!CONDOIL.test(LH))return false;/* RULE 178 twin of matcher.ok: a NAMED oil is not a DIFFERENT named oil. His ruling, 9-Sep, shown the 10:00 run report listing this as the first item still standing and still his: "fix and finish it". Fourteen GREEN/YELLOW lines across eleven households had a recipe NAMING one oil answered by another — y39 coconut oil for a nadan chicken curry taking 634 ml of olive, y22 coconut and mustard both taking 1,255 ml of Tata olive, h9 mustard for litti chokha taking groundnut. Measured live with resolve() over every board: 18 of 1,321 pairs changed, 50 rows un-pooled, 0 newly pooled, and 11 named-oil needs now correctly read ABSENT — under-answering, which asks a cook to buy oil rather than telling them a different oil counts. THE GENERIC POOLING IS KEPT AND THAT IS THE DESIGN: it needs the word `oil` on BOTH sides AND a variety named on BOTH sides AND the two sets disjoint, so "Cooking oil"/"Oil"/"Oil/Ghee" still reach any oil (recipes_v2 gives every fat label the bare 'oil' keyword on purpose) and a row naming no variety — y41's 899.8 ml "Refined Oil" — still answers a named need. Set intersection, not equality, so a label or row naming several varieties reaches all of them. Ghee is not in the table at all; MUST_NOT already separates oil from ghee. PP_OILNAMES is GENERATED from matcher.OILNAMES by splice_only. */if(OILWORD.test(LH)&&OILWORD.test(n)){var _loil={},_noil={},_oi,_oany=false,_ohit=false;for(_oi=0;_oi<PP_OILNAMES.length;_oi++){var _orx=PP_OILNAMES[_oi][0],_onm=PP_OILNAMES[_oi][1];var _ol=_orx.test(LH),_on=_orx.test(n);if(_ol)_loil[_onm]=1;if(_on)_noil[_onm]=1;if(_ol&&_on)_ohit=true;if(_ol)_oany=true;}if(_oany&&Object.keys(_noil).length&&!_ohit)return false;}/* RULE 168 twin of matcher.ok: a vinegar need is answered only by vinegar, and never by what is pickled in it. y28 "Rice Vinegar" -> "Rice" (4,132 g) read GREEN because the asymmetry rule only fires when BOTH sides declare a form and the ROW declared none; y36 "Vinegar" -> "Abbie's Sliced Jalapenos in Vinegar" (594 ml) read GREEN because the row DOES carry the word. Narrow to vinegar on purpose: the general "label declares a form, row declares none" mirror would break "Red chilli powder"->"Chilli" and "Turmeric"->"MTR Turmeric Powder", which GROUND_ONLY protects. *//* RULE 169 twin of matcher.ok: a peri-peri SEASONING BLEND is not the food it is flavoured with. His ruling, 8-Sep: y28 Cheese -> "The Only Piri Piri Cheese Mix" (135 g) read GREEN for a cheese egg bhurji while their Amul slices and D'Italia parmesan sat beside it; "The Only" is a seasoning brand (Black Pepper grinder, Cardamom, Garlic Powder, Parsley, Salad Seasoning Mix). BOTH tests are on the ROW on purpose. A bare \bmix\b guard is unusable (231 rows: Mixed Sprouts, Mix Dal, Mixed Lettuce, Frozen veg mix); a FORM of seasoning/sprinkler would refuse y26's CORRECT "Chaat masala" -> "Catch Sprinkler Chat Masala"; and PIRIPIRI alone would strand real protein, because this ledger's peri-peri prawns, tempeh and chicken ARE prawns, tempeh and chicken. Reads the FULL label to disarm, like 164/165. */if(PIRIPIRI.test(n)&&SEASONROW.test(n)&&!PIRIPIRI.test(String(label)))return false;/* RULE 183 twin of matcher.ok: a SEASONING blend is not the STARCH it seasons. His report, 9-Sep 23:30: "Oregano show not available in handover but we have Keya pizza pasta oregano spice mix in inventory" — y40 holds 40 g and the Oregano need read nothing. THE CAUSE WAS THE 8-SEP FIX FOR HIS OWN EARLIER REPORT: `Pasta -> Keya Pizza Pasta Oregano Spice Mix` was closed by putting `\bpizza\s*pasta\b` into NEGCLASS, and NEGCLASS means "this row is not food at all", so it refused the row for EVERY label including the one food the row actually is. That entry is REMOVED and this directional guard replaces it. Disarmed when the LABEL is itself a seasoning, or "Pizza Spice Mix" — a real need label here — would refuse itself. SEASONMIX is SEASONROW WITHOUT the bare \bmix\b, because Rule 169 already measured that word as unusable alone (231 rows) and a boxed "Pasta Mix" really is pasta. MEASURED WITH resolve() AND NOT ok(): ok() approved 48 pairs of this shape but lb() offers almost none, so counting ok() would have priced a dead guard as a win. Live: y40 Oregano 0 rows -> 1 (40 g), y40 Pasta keeps its real Disano Penne 340 g and does not gain the blend. Python twin: matcher.ok, Rule 183. */if(STARCHLBL.test(LH)&&SEASONMIX.test(n)&&!SEASONMIX.test(String(label)))return false;/* RULE 170 twin: a seed need is not the fresh leaf. Rule 17c blocks the reverse; this is the missing half, and it is a SHORT list rather than the general mirror because Rule 105 says the opposite for jeera/mustard/saunf. */if(SEEDLBL.test(LH)&&SEEDLEAF.test(LH)&&SEEDLEAF.test(n)&&!SEEDLBL.test(n))return false;/* RULE 171 twin: a flavoured dairy tub is not the fruit on its label. Directional - a YOGURT need must still reach the tub, so it only refuses when the label is a fruit naming no dairy. */if(FRUITLBL.test(LH)&&DAIRYTUB.test(n)&&!DAIRYTUB.test(LH))return false;/* RULE 196 twin of matcher.ok: A CONFECTIONERY IS NOT THE FRUIT ON ITS LABEL - the same argument as Rule 171 one aisle over. y24's Mango and Raw mango needs were both answered by 460 g of "Organic Mango Fruit Gummies" while their real Raw Mango row sat at 0 g, and y09's Blueberries pooled a Hershey bar. THE VOCABULARY IS SHORT BECAUSE THE resolve() SWEEP SAID SO: `\bbar\b` is unusable because "Yoga Bar" is a BRAND on real rolled oats, and a bare `choco` is unusable because y16's "Chocolate oats", y27's "Pintola High Protein Oats (Chocolate)", y26's choco-almond muesli and y28's "Protein Powder (chocolate)" are all genuinely the food asked for. Directional and disarmed by the label, so a Chocolate need still reaches every chocolate row. Python twin: matcher.ok, Rule 196. */if((FRUITLBL.test(LH)||FRUITCLS.test(LH))&&CONFECT.test(n)&&!CONFECT.test(String(label)))return false;/* RULE 174 twin of matcher.ok: a NAMED berry is not a DIFFERENT named berry. His ruling, 8-Sep: "fix the blueberry strawberry group". aliases.json group 65 ['berries','blueberry','blackberry','strawberry'] declares four fruits one food, and the resolver pooled them while inventory.ppMNorm already keyed each berry as its own commodity — so this closes a Rule 129 disagreement rather than opening one. Measured live: 15 pairs removed, 0 added, four of them holding real stock (y14 Strawberries -> Imported Blueberry 1000 g, y20 375 g, y29 Blueberries -> Strawberry-Ooty 180 g, y31 -> Blueberry Jam 100 g). Disarmed by a label naming no specific berry (Berries/Fruit), or naming several. PP_BERRYNAMES is GENERATED from matcher.BERRYNAMES by splice_only. */var _lber={},_nber={},_bi,_bany=false,_bhit=false;for(_bi=0;_bi<PP_BERRYNAMES.length;_bi++){var _brx=PP_BERRYNAMES[_bi][0],_bnm=PP_BERRYNAMES[_bi][1];var _bl=_brx.test(String(label)),_bn=_brx.test(n);if(_bl)_lber[_bnm]=1;if(_bn)_nber[_bnm]=1;if(_bl&&_bn)_bhit=true;if(_bl)_bany=true;}if(_bany&&Object.keys(_nber).length&&!_bhit)return false;/* RULE 172 twin: green/herbal tea is not black tea leaves. */if(TEALBL.test(LH)&&!GREENTEA.test(LH)&&GREENTEA.test(n))return false;/* RULE 173 twin: a qualifier on the ROW that makes it a different plant. Measured live: Sweet Potato answered Potato on three households (300/120/90 g), Black Turmeric answered Turmeric (128 g), Everest White Pepper answered Black pepper (97 g), Black Cardamom answered Cardamom (40/39 g), Kalonji answered Jeera (33 g). */for(var _vi=0;_vi<PP_VARIANTROW.length;_vi++){var _vr=PP_VARIANTROW[_vi][0];if(_vr.test(n)&&!_vr.test(String(label)))return false;}/* RULE 173b twin: the mirror of 170 - a FRESH-herb need must not take the dry seed either. y22 held 153 g of Orika Coriander whole against a fresh coriander need. SEEDROW excludes the BRAND Whole Farm. */if(SEEDLEAF.test(LH)&&SEEDROW.test(n)&&!SEEDROW.test(String(label)))return false;/* RULE 173c twin: cloves (laung) are not garlic cloves - a GARLIC label still reaches them. */if(/\bcloves?\b/i.test(LH)&&!/garlic/i.test(LH)&&/\bgarlic\b/i.test(n))return false;/* RULE 173d twin: a wheat ATTA need is not answered by gram flour (y36 Roasted Bengal Gram Atta). The generic Flour label is untouched. */if((/\batta\b/i.test(LH)||/\bwheat\b/i.test(LH))&&!/gram|besan|ragi|bajra|jowar|millet|maize|makai/i.test(LH)&&/\bbengal\s*gram\b|\bbesan\b|\bgram\s*flour\b/i.test(n))return false;/* RULE 187a twin: a GENERIC flour label takes a cereal flour, not a specialty one. y31's roux `Flour` need was taking Raw Jackfruit Flour while 3,570 g of Wheat Atta sat beside it. Maize and gram are deliberately excluded - a bare Flour label reaching Makka Flour is his 9-Sep ruling and reaching besan is Rule 173d's stated decision. */var NONCEREALFLOUR=/\b(?:jackfruit|banana|plantain|almond|cashew|coconut|tapioca|water\s*chestnut|singhara|kuttu|buckwheat|sago|arrowroot)\b[^,;]{0,18}?\b(?:flour|atta|meal)\b/i;var GRAINONLYLBL=/\bmillets?\b|\bfoxtail\b|\bbarnyard\b|\bproso\b|\bkodo\b|\bbrowntop\b/i;var FLOURFORMLBL=/\b(?:flour|atta|maida|besan|meal|rava|rawa|sooji|suji|semolina|starch|batter|podi)\b/i;if(FLOURLBL.test(LH)&&NONCEREALFLOUR.test(n)&&!NONCEREALFLOUR.test(LH))return false;/* RULE 187b twin: a flour is not the FRESH food or the WHOLE seed. Narrow on purpose - `Ragi`->Ragi Flour and `Jowar`->Jowar Flour are correct, so this fires only where the label itself insists on the unmilled form. */if(/\bflour\b/i.test(n)&&!FLOURFORMLBL.test(LH)&&/\braw\b|\bfresh\b|\bwhole\b|\bseeds?\b|\btender\b/i.test(LH))return false;/* RULE 187c twin: a MILLET need is the GRAIN, not a flour. His 10-Sep ruling. All 72 cards carrying the `Millet` label cook the whole grain (khichdi, bisi bele bath, biryani, payasam, upma, cooked millet rice, cutlet, bhagar), and the label's keywords are foxtail/little/ barnyard - bajra is PEARL and ragi is FINGER millet, reached only through the row's parenthetical gloss. `Ragi`->Ragi Flour and `Jowar`->Jowar Flour stay allowed on purpose. Placed AFTER 187a/187b because it reads FLOURFORMLBL, whose var assignment lives there - hoisting would leave it undefined and throw. */if(GRAINONLYLBL.test(LH)&&!FLOURFORMLBL.test(LH)&&/\b(?:flour|atta|meal)\b/i.test(n))return false;/* RULE 173e twin: a RICE need is not answered by oil - the words rice bran carried y09 there. */if(/\brice\b/i.test(LH)&&!OILWORD.test(LH)&&OILWORD.test(n))return false;/* RULE 173f twin: bread is not milk (y24 Iyengar Bakery Milk Bread, NOICE Buttery Milk Bread). */if(/\bmilk\b/i.test(LH)&&BREADLBL.test(n)&&!BREADLBL.test(LH))return false;/* RULE 173g twin: a curd is not the nut it is made from (y31 ONE GOOD Peanut Kurd). */if(NUTTY.test(LH)&&/\bkurd\b|\bcurd\b|yogh?urt/i.test(n)&&!/\bkurd\b|\bcurd\b|yogh?urt/i.test(String(label)))return false;/* RULE 173h twin: an egg is not a bean - (Nut & Bean Feed) is prose about the hens. */if(/\bbeans?\b/i.test(LH)&&/\beggs?\b/i.test(n)&&!/\beggs?\b/i.test(LH))return false;/* RULE 173i twin: a COOKED packet is not the dry pulse when the label says dry or raw. Reads the FULL label, since Chana (dry) carries it in the parenthesis and a refusal is safe to arm from anywhere. */if(/\b(dry|dried|raw)\b/i.test(String(label))&&/\bcooked\b/i.test(n)&&!/\bcooked\b/i.test(String(label)))return false;/* RULE 173j twin: a prepared food is not cooking fat, even when its name says which oil it was made with - NOICE hummus, tzatziki and methi thepla answered four named-oil needs on y24. */if(OILWORD.test(LH)&&/hummus|tzatziki|thepla|laddoo|paratha|croissant|\bmomos?\b|\bwrap\b/i.test(n))return false;/* RULE 173k twin: a masala blend is not a single-spice form (y40 Chilli flakes took Chings Paneer chilli Masala mix, 54 g). */if(/\bflakes?\b|\bseeds?\b|\bwhole\b(?!\s+farm)/i.test(LH)&&/\bmasala\b/i.test(n)&&!/\bmasala\b/i.test(LH))return false;/* RULE 173l twin: a sambar VEGETABLE mix is not an onion. */if(ONIONW.test(String(label))&&(/\bsambh?ar\b[\s\S]*\bmix\b/i.test(n)||/\bmix\b[\s\S]*\bsambh?ar\b/i.test(n)))return false;/* RULE 173m twin: a chilli need is not a staple-grain product, even when both declare the same form. Disarmed by a label naming the grain. */if(/chill?i|mirch/i.test(LH)&&GRAINROW.test(n)&&!GRAINROW.test(LH))return false;if(VINLBL.test(LH)){if(!VINLBL.test(n))return false;if(PRESERVEDIN.test(n)&&!PRESERVEDIN.test(LH))return false;}/* RULE 176 twin of matcher.ok: a PEPPERCORN need is not a chilli and not a cereal. Both roads were opened by putting `black pepper` into GROUND_ONLY on 9-Sep — the form-asymmetry refusal had been standing in front of them. The chilli half is LATENT (lb() cannot offer a chilli row for ['black pepper','kali mirch','peppercorn','pepper powder']) and is guarded anyway, like Rule 173m. The CEREAL half was LIVE: y26's "BB Royal Oats Black Pepper Powder" (70 g) welds a cereal and a spice into one row name and started answering a pepper need. THE LABEL PHRASE IS STRIPPED BEFORE ASKING WHETHER THE LABEL ALSO MEANS CHILLI, exactly as Rule 156 strips sweet-lime: `kali mirch` CONTAINS `mirch`, the Hindi word for chilli, so a bare disarm would leave the Kali Mirch label unguarded — and that is the one label the 8-Sep measurement watched walk into "Red Chilli Powder (Mirchi Lal)". Python twin: matcher.ok, Rule 176. */if(PEPPERCORN.test(LH)&&!CHILLIFOOD.test(String(LH).replace(PEPPERCORN_G," "))){if(CHILLIFOOD.test(String(n).replace(PEPPERCORN_G," ")))return false;if(GRAINROW.test(n)&&!GRAINROW.test(LH))return false;}/* RULE 176b twin of matcher.ok — a CHILLI need is not a PEPPERCORN. `kali mirch` contains `mirch`, the Hindi word for chilli, so every chilli need reached black pepper: Green chilli <- Kaali Mirch (whole), Dried red chilli <- Kali Mirch (Black Peppercorns). Row phrase stripped before asking whether the row ALSO means chilli, so a row naming both stays reachable. Rule 66h is what proves these two agree. */if(PEPPERCORN.test(n)&&!PEPPERCORN.test(LH)){if(CHILLIFOOD.test(LH)&&!CHILLIFOOD.test(String(n).replace(PEPPERCORN_G," ")))return false;}if(BLACKSALT.test(n)&&!BLACKSALT.test(LH))return false;/*66h: kala namak is its own seasoning with its own dose; Python has had this guard and the browser had none, so a Salt need on y14 reached "Catch Black Salt Sprinkler".*//* RULE 154 twin: a pack of several different foods is not one of them. ' + ' and 'mixed pack' only — Rule 151 needs Assorted/Tricolour/'&' rows to stay reachable. */if(MIXPACK.test(n)&&!MIXLBL.test(label))return false;/* RULE 164 twin of matcher.ok: a prepared dish is not the ingredient it contains. "India Gate Jeera Rice" answered a jeera call, "McCain Potato Cheese Shotz" a cheese call and "Indomie Chicken Instant noodles" a chicken call. The ROW must carry the dish word as its HEAD (rice is anchored to the end, so "Rice Flour" and "Rice Vinegar" stay reachable) while the LABEL only has to mention it anywhere -- testing the label with the anchored form cost nineteen households their rice. BUTCHERCUT is the exemption match_tests found: "Chicken Biryani Cut" is raw chicken jointed for a biryani, not a biryani. *//* Reads the ROW'S HEAD — the text before its first parenthesis — as the Python twin does, for the mirror of Rule 17d's reason: a parenthetical is prose ABOUT the row and must not ARM a guard. y28 stocks "Ajwain Jeera Powder (homemade, for potato fry)", where the fry says what the powder is FOR, and reading the whole name made that jeera unspendable (Rule 115i). */if(DISHROW.test(String(n).split("(")[0])&&!DISHLBL.test(label)&&!BUTCHERCUT.test(n))return false;/* RULE 165 twin of matcher.ok: pet food is not food. "Sheba Chicken flavour" answered a Chicken call on y40 -- it is a cat food, stocked in grams like everything else, and NEGCLASS had no opinion about pets. Brands and explicit phrases only: a bare \bpet\b would have blocked c204's "Cloves (PET jar)", where PET is the plastic. */if(PETFOOD.test(n)&&!PETFOOD.test(label))return false;/* RULE 189 twin of matcher.ok: a CREAM need is not paneer, cheese, khoya or cream of tartar. His report, 10-Sep: y33 "Heavy cream showing not available , but we have Fresh cream". The alias group had held malai/fresh/heavy/whipping cream for weeks; y33's row is the bare word `Cream`, which none of them reaches, and the word could not just be added because a bare `cream` keyword also reaches five full cream MILKs, five ICE creams, two cream CHEESEs, a cream of TARTAR and a tin of creamy pet-food tuna. Looking for the guard exposed the worse half, already live: `malai` reaches MALAI PANEER, so a cream need was answered by paneer on THIRTEEN households, 640 g of it stocked. Directional and disarmed by the label, like 164/165: a paneer label still reaches every paneer row. */if(CREAMLBL.test(LH)&&NOTCREAM.test(n)&&!NOTCREAM.test(String(label)))return false;/* RULE 192 twin of matcher.ok: ICE CREAM IS NOT CREAM, AND CREAM IS NOT ICE CREAM. His ruling, 11-Sep, on y24: "y24's Vanilla Ice Cream need pools \"Milky Mist UHT Cream\". should not map , it is not correct". This is the half Rule 189's OWN NOTE predicted and did not write — its measurement listed "five ICE CREAMs" among what a bare `cream` keyword reaches, and NOTCREAM then named paneer, cheese, tartar, khoya and creamer but not them. Both ways, because it is one food question: cream is an INGREDIENT of ice cream, not a substitute for it — the mirror of Rule 164 with label and row the other way round. NOTCREAM (generated) closes cream-label -> ice-cream-row; this line closes ice-cream-label -> any row that is not ice cream. Measured live with resolve() over every board, never with ok(): 77 pairs removed across the two rules, 0 added. */if(ICECREAM.test(LH)&&!ICECREAM.test(n))return false;/* RULE 193 twin of matcher.ok: A PAV IS NOT A LOAF OF BREAD. His ruling, 11-Sep, on y31: "y31 Pav reads GREEN on 160 g of The Health Factory Zero Maida Multigrain Bread , they both are diffrent items". THREE layers said they were one food and all three moved: recipes_v2 gave the Pav label the bare keyword `bread`; alias group 61 was [bread,beed,pav] so even [pav,bun] EXPANDED into bread on the fallback pass, which is exactly y31 (the fallback fires when the strict pass reached no STOCK, and y31 holds no pav row at all); and ok() permitted the pair. The alias group had to go too because POOLING HAS TWO LAYERS — the resolver and inventory ppMNorm grouping — and splitting one without the other is what made two boards disagree over shallots. THE TEST IS "ONLY", like Rule 156: y32 holds "Baker's Loaf Zero Maida Pav", which names BOTH, so it is refused for neither label. */var _lpav=PAVFOOD.test(LH),_lloaf=LOAFFOOD.test(LH),_npav=PAVFOOD.test(n),_nloaf=LOAFFOOD.test(n);if(_lpav&&!_lloaf&&_nloaf&&!_npav)return false;if(_lloaf&&!_lpav&&_npav&&!_nloaf)return false;/* RULE 153 twin of matcher.ok: a green chilli is not a red/dried chilli. NOT Rule 151, which merges bell-pepper colours on his ruling — for a chilli the colour IS the food. */if(CHILLIFOOD.test(LH)&&CHILLIFOOD.test(n)){var _clg=CHILGREEN.test(LH),_clr=CHILRED.test(LH),_cng=CHILGREEN.test(n),_cnr=CHILRED.test(n);if(_clg&&!_clr&&_cnr&&!_cng)return false;if(_clr&&!_clg&&_cng&&!_cnr)return false;}/* RULE 156 twin of matcher.ok: a sweet lime (mosambi) is not a lemon. The lemon alias group holds "lime" and "Mosambi (Sweet Lime)" contains that word, so lb() found it and ok() had no opinion. The sweet-lime phrase is STRIPPED before asking whether a name also means sour citrus, or "Sweet Lime" would read as a lime and the guard would refuse itself — that is also what lets a row naming BOTH ("Lemons/Sweet Limes") keep answering a lemon need. */var _lsw=SWEETLIME.test(LH),_lso=SOURCITRUS.test(String(LH).replace(SWEETLIME_G," ")),_nsw=SWEETLIME.test(n),_nso=SOURCITRUS.test(String(n).replace(SWEETLIME_G," "));if(_nsw&&!_nso&&_lso&&!_lsw)return false;if(_lsw&&!_lso&&_nso&&!_nsw)return false;/* RULE 157 twin: "orange" in front of another food is a colour, not the fruit — an orange need reached "Orange Carrot". ORANGEMOD is generated from the alias vocabulary, so a food added to aliases.json is covered without touching this. *//* RULE 195 twin of matcher.ok: AND THE CLASS LABEL ABOVE THE FRUIT ARMS RULE 157 TOO. Rule 157 required ORANGEAS on the LABEL, so it never armed for the generic `Fruit` need the splitter emits when a menu names no specific fruit - and "Orange Carrot" sat in the fruit pool of SEVEN households (y26 431.4 g, h9 174.7 g). The ORANGEAS condition STAYS: dropping it would refuse a plain Carrot need its own Orange Carrot row, which is the mapping y26's cabbage-carrot thoran actually spends. Python twin: matcher.ok, Rule 195. */if(ORANGEMOD.test(n)&&!ORANGEMOD.test(LH)&&(ORANGEAS.test(LH)||FRUITCLS.test(LH)))return false;if(GREENPEA.test(LH)&&WHITEPEA.test(n))return false;if(WHITEPEA.test(LH)&&GREENPEA.test(n)&&!WHITEPEA.test(n))return false;/*66h: was !WHITEPEA.test(LH+n) — LH is a prefix of LH+n so this guard never fired, the same typo the Python twin carried. The escape is for a ROW naming both peas.*/if(CAPFOOD.test(LH)&&CAPCHILLI.test(n)&&!CAPFOOD.test(n))return false;/*17g: a sweet pepper is not a chilli. resolve()'s fallback expands a second time and "shimla mirch" reaches the ['chilli','mirch'] group, so with only the colour guard a red-pepper need ate Byadgi chilli and dried red chillies. The existing guard below only blocks rows named "pepper".*//* RULE 151 (27-Aug) — the colour clause that stood here is GONE. Jayant: "in bell paper all come red bell paper , yellow bell paper etc". This reverses his own 21-Aug tri-colour split described below. The CAPCHILLI guard above stays. Python twin: matcher.ok. *//*17g: green capsicum and red/yellow bell pepper are different foods (Jayant, 21-Aug, the tri-colour pack). Split by COLOUR, not by word: the Recipe Master never asks for "capsicum" and the shelves rarely say "bell pepper", so cutting the alias group would strand 1,985 g across ten households. The escape tests the ROW — a tri-colour row really holds both.*/if(DERIV.test(n)&&!DERIV.test(LH)){
      /* PARITY with matcher.py — THE LABEL MAY NAME THE DERIVED FORM IN A PARENTHESIS. The guards
         read only the label HEAD so packaging prose cannot disarm them (Rule 17d), but
         "Semolina (rava)" is a SYNONYM GLOSS: semolina IS rava. Reading the FULL label just for this
         test recovered rava on SEVEN households that a semolina need could not see at all. The row
         may introduce no derived form the label did not also name, so "Fenugreek Seed Podi" stays
         blocked from "Methi (seeds)". DERIV_NOTSEED is deliberately not reused here — it lists rava
         itself and would veto the very case this allows. */
      var _nw=PP_DERIV_WORDS.filter(function(w){return w.test(n);});
      var _sameForm=_nw.length>0&&_nw.every(function(w){return w.test(label);});
      var _seedIsSpice=((SEEDSPICE.test(LH)&&SEEDSPICE.test(n))||(SEEDGRAIN.test(LH)&&SEEDGRAIN.test(n)))&&!DERIV_NOTSEED.test(n);
      if(!(_seedIsSpice||_sameForm))return false;}
    if(AROMA.test(LH)&&!AROMAX.test(LH)&&AROMAX.test(n))return false;
    if(BREADLBL.test(LH)&&!BREADX.test(LH)&&BREADX.test(n))return false;
    for(var _q=0;_q<_QV_L.length;_q++){if(!_QV_L[_q].test(n))return false;}
  /* ...AND THE MIRROR. Rule 106 is symmetric: a qualifier names a different vegetable, so the
     direction should never have mattered. Only the qualified-label case was guarded, leaving a
     bare "tomato" free to take cherry tomatoes (Jayant, 20-Aug), "potato" to take sweet potato
     and "corn" to take baby corn. */
  for(var _qm=0;_qm<_QR_L.length;_qm++){if(_QR_L[_qm].test(n))return false;}
    for(var _p=0;_p<PEAX.length;_p++){if(PEAX[_p][0].test(LH)&&PEAX[_p][1].test(n)&&!PEAX[_p][0].test(n))return false;}
    for(var _s=0;_s<SUBX.length;_s++){if(SUBX[_s][0].test(LH)&&SUBX[_s][1].test(n)&&!SUBX[_s][1].test(LH))return false;}
    if(NEGCLASS.test(n)&&!NEGCLASS.test(label))return false;
    /* PRECEDENCE (Jayant, 11-Aug): if the MENU names yogurt/greek yogurt/skyr, only yogurt may be
       charged — never curd, and no substitution when the yogurt is out (the line goes absent).
       A COOKDISH word still forces curd even if the menu said yogurt (raita, kadhi, ...). */
    /* 16-Sep twin of matcher.ok's `_either` — A LABEL THAT NAMES BOTH IS AN EITHER/OR, AND
       NEITHER EXCLUSION MAY FIRE ON IT. y33 holds 50 g of "Sid's Farm Curd", `in`, and its
       `Curd/Yogurt` need read ABSENT here while Python said yes — the Rule 66h divergence.
       A slash label is a deliberate either/or, so reading only half of it is backwards.
       A PARENTHETICAL NARROWS IT and is read separately, so the standing MUST-NOT pair
       ('Curd/yogurt (protein yogurt)', 'Akshayakalpa Organic Probiotic Pouch Curd') still
       refuses. A COOKDISH word still forces curd — Jayant's 11-Aug precedence is untouched.
       Python twin: matcher.ok, `_either`; Rule 66h proves they agree. */
    var _outside=label.replace(/\([^)]*\)/g,' ');
    var _inparen=(label.match(/\(([^)]*)\)/g)||[]).join(' ').replace(/[()]/g,' ');
    var _either=/curd|dahi/i.test(_outside)&&YOGEAT.test(_outside)
                &&!YOGEAT.test(_inparen)&&!COOKDISH.test(label);
    if(FERMENT.test(n)&&!_either){
      if(YOGEAT.test(label)&&!COOKDISH.test(label)){ if(!YOGEAT.test(n))return false; }
      else if(COOKDISH.test(label)||(COOKUSE.test(label)&&!EATUSE.test(label))){
        if(!PLAINCURD.test(n))return false; if(NOTCOOKCURD.test(n))return false; }
    }
    if(NEGFREE.test(n)&&!NEGFREE.test(label))return false;
    /* RULE 77 — some spices have no unprocessed form. The guard below is right for Tomato->Ketchup
       and Rajma->Rajma Masala, and wrong for turmeric and hing: nobody stocks a turmeric that is not
       a powder, so "Turmeric" never matched "MTR Turmeric Powder" and read OUT in 8 of 11 households
       while they held 31-290 g. Only the word POWDER is forgiven; sauce/paste/pickle/masala are
       still different products. Kept in step with matcher.GROUND_ONLY. */
    var GROUND_ONLY=/^\s*(turmeric|haldi|hing|asafoetida|amchur|dry mango|oregano|vanilla|black pepper|garam masala|corn\s*starch)\b/i;
    /* RULE 177 twin of matcher.ok: a POWDER THAT RECONSTITUTES INTO THE LIQUID THE LABEL NAMES.
       Same shape as the GROUND_ONLY branch above and the same reason — the Tomato->Ketchup refusal
       is right in general and wrong for this one food. y09 held 70 g of "Coconut milk powder"
       against a 90 ml coconut-milk need and the board asked them to buy coconut milk. BOTH patterns
       must match, so it cannot widen into "a powder is a liquid": Milk -> Milk Powder stays refused
       and so does Coconut -> Coconut milk powder. The YIELD is PP_DENSITY's, not this branch's
       (1 g -> 3 ml, his figure). Python twin: matcher.ok, Rule 177; Rule 66h proves they agree. */
    var _rec=false,_ri;
    for(_ri=0;_ri<PP_RECONSTITUTES.length;_ri++){
      if(PP_RECONSTITUTES[_ri][0].test(n)&&PP_RECONSTITUTES[_ri][1].test(LH)){_rec=true;break;} }
    if(!spiceL&&PROC.test(n)&&!PROC.test(label)&&_rec){ /* allow */ }
    else if(!spiceL&&PROC.test(n)&&!PROC.test(label)&&GROUND_ONLY.test(label)
       &&!/sauce|paste|pickle|ketchup|masala|chutney|dip|spread|squash|juice/i.test(n)){ /* allow */ }
    else if(!spiceL&&PROC.test(n)&&!PROC.test(label))return false;
    if(spiceL&&!PROC.test(n))return false;
    /* RULE 176c twin of matcher.ok — A SPICE-POWDER NEED IS NOT A CONDIMENT THAT CONTAINS
       THE SPICE. The line above refuses an UNPROCESSED row for a spice label; it has the
       opposite hole, so every PROCESSED row carrying the word passed and a Garlic Powder
       need reached Hellmann's Roasted Garlic Veg Mayo and Master Chow Garlic Chilli Crisp.
       The plain `Garlic` label refuses both — it is the POWDER label, by declaring a form,
       that walks around the guard protecting the bare one. Directional: fires only when the
       ROW declares a condiment class and the LABEL names none, so a Mayonnaise or Chilli
       oil need still reaches its own row. Rule 66h proves these two agree. */
    if(spiceL&&(MAYOSAUCE.test(n)||CONDOIL.test(n))&&!(MAYOSAUCE.test(LH)||CONDOIL.test(LH)))return false;
    /* A CUT OF MEAT IS MEAT, EVEN WHEN IT IS SOLD IN CUBES — twin of matcher.MEATCUT, 17-Sep.
       The `cube` in the list means a STOCK cube (Maggi Magic Cubes (Chicken) is bouillon), but the
       word also names the shape a butcher dices meat into, and two live rows paid for it: y09's
       "FreshtoHome Premium Chicken Boneless Cubes" and y22's "FOBS Basa Boneless cubes" holding
       250 g while a Fish need reached NOTHING — that household would have been told to buy fish it
       already had. Disarmed only by a word that appears on a real CUT; a stock cube is never
       described as boneless or filleted, so every sausage, salami, nugget and the Maggi cubes stay
       refused. Measured: 2 of 145 meat/fish needs change, both gains, nothing lost.
       Rule 66h proves these two agree — it is what caught this twin missing. */
    if(meatL&&/sausage|cube|stock|seekh|khilei|nugget|salami|ham\b/i.test(n)
       &&!/\bboneless\b|\bbreasts?\b|\bcurry\s*cut\b|\bdiced\b|\bfillets?\b|\bmince[d]?\b/i.test(n))return false;
    /* RULE 17c DRY twin, now DECLARED rather than inline. The label side is DRYX_LBL, which knows that kasuri/kasoori/qasuri MEAN dried — y36 held 40 g of "Kasuri Methi (Dried Fenugreek Leaves)" against a "Kasuri methi" need and the board read RED, because the ROW said Dried and the LABEL did not. Both patterns are GENERATED from matcher.DRYX/DRYX_LBL by splice_only; they were inline here, which is exactly why the Python fix sat unshipped since 8-Sep. Splitting them also restores `dehydrated` to the label test, which the inline copy had been missing. */if(DRYX.test(n)&&!DRYX_LBL.test(label)&&/ginger|chill|coconut|mango|fish|prawn|grape|onion|garlic|tomato|methi|fenugreek|coriander|mint|curry lea/i.test(label))return false;/* THE MIRROR, 16-Sep. Python twin in matcher.ok. The line above refuses a DRIED ROW for a fresh LABEL; nothing refused a DRIED LABEL reaching a fresh or derived ROW, so a Kasuri methi need drew on plain Methi and on Methi Dana (the seed). Jayant: "(kasuri methi, or kasturi methi), methi and methi seeds all three are diffreent". SCOPED to methi and ginger, NOT to the whole list above: written against all of it, it refused three live pairs that are CORRECT - Dried red chilli <- Whole Red Chilli / Byadagi Chilli, because a whole red chilli IS the dried one and nobody writes the word. Rule 66h proves these two agree. */if(DRYX_LBL.test(label)&&!DRYX_LBL.test(n)&&/\bmethi\b|\bfenugreek\b|\bginger\b|\bsonth\b|\bsaunth\b/i.test(label))return false;
    /* 8-Sep: this guard had the derivative list HAND-TYPED inline, TWICE, while var RICE_DERIV sat spliced from matcher.py and never read - a dead declaration. Rule 66h refused the 18:32 bake over it: \bsticks?\b, \bpaper\b and \bmix\b were added to the Python RICE_DERIV and the browser went on answering y30 Basmati Rice with "Real Thai Rice Stick 3mm". Now it USES the generated constant. */if(/rice/i.test(label)&&!RICE_DERIV.test(label)&&RICE_DERIV.test(n)&&!(/\brice\s*$/i.test(String(n).trim())&&!/batter|\brava\b|flour|podi|\bmix\b|noodle|papad|poha/i.test(n)))return false;
    /* 26-Aug -- SHALLOTS BYPASSED THIS GUARD. It tested the LABEL for /onion/, and the 24-Aug
       shallot==onion ruling introduced the label 'Shallots' (kws shallot/sambar onion/onion),
       which contains no 'onion'. So Spring onion answered a shallot need: h9's ppInvForLabel
       returned the onion commodity AND spring onion, the Smart list attributed spring onion's
       160 expired g to the onion row (3535 -> 3695 'expired') while the dashboard card said
       fresh, and Rule 129 refused the bake. Spring onion is a different plant and answers no
       bulb-onion need. Twin: matcher.py -- Rule 66h refuses a half-done change. */
    /* THE LABEL TEST IS GENERATED FROM aliases.json, not hand-typed. A Kannada need spelled
       "Eerulli" slipped past `/onion|shallot/` and pooled y28's SPRING ONION into its onion — 855 g
       where 755 g was right. ONIONW is every name the alias table knows for onion, exported by
       splice_only.py from the same table matcher.py reads, so the next language extends both engines
       at once. Twin of matcher.py's guard. */
    if(ONIONW.test(label)&&!/spring/i.test(label)&&/spring onion/i.test(n))return false;
    /* A SHALLOT IS AN ONION -- 24-Aug, Jayant: *"oniom, red onion and shellout same"*. The guard that
       stood here returned false for sambar / small / pearl onion, and the reason it was written is
       worth keeping even though the verdict is reversed: with red onion pooled and shallot not,
       vs204's onion CARD read wholly expired on 580 g of Red Onions while the Smart LIST still
       aggregated 150 g of fresh sambar onion and read 'partial'. Two boards, both right, one label
       spanning two foods. He has now said it is one food, so the split is what goes -- from the
       resolver here, from matcher.py's twin, and from the GROUPING in inventory.py's ppMNorm, all in
       one change. Removing it from any two of the three re-creates that exact inconsistency with the
       sides swapped. Rule 66h refused the first bake of this change for precisely that reason: the
       Python half was done and this line was not. SPRING ONION IS STILL NOT ONION -- that guard is
       the line directly above and it stays; it is a different plant. */
    /* MAKAI ATTA IS MAIZE, WHEAT ATTA IS WHEAT, and A NUT BUTTER IS NOT THE NUT. Twins of the two
       guards added to matcher.py on 25-Aug; both constants are GENERATED by splice_only.py from the
       same Python regexes, so this cannot drift the way the shallot guard did. The maize merge had
       already been rejected by hand in write_21aug_y32.py and the resolver went on pooling it. */
    if(/\batta\b|wheat flour|\bwheat\b/i.test(label)&&!MAIZEF.test(label)&&MAIZEF.test(n))return false;
    if(MAIZEF.test(label)&&!MAIZEF.test(n)&&/\batta\b|wheat flour|\bwheat\b/i.test(n))return false;
    /* A FLOWER IS NOT THE BEAN IT IS NAMED AFTER. "Urban Platter Blue Butterfly Pea Flower" is a dried
       tea flower; it carries the word "pea", so a black-eyed-pea need reached it the moment pooling
       came back on for that label — 0 g of pulse reported as stock. Banana flower and moringa flower
       are the same shape. Twin of matcher.py's guard; FLOWERROW is generated by splice_only.py. */
    if(FLOWERROW.test(n)&&!/\bflowers?\b/i.test(label))return false;
    if(NUTTY.test(label)&&!/\bbutter\b/i.test(label)&&/\bbutter\b/i.test(n)&&!/buttermilk|butter milk/i.test(n))return false;
    if(/butter|milk/i.test(label)&&!/buttermilk|butter milk/i.test(label)&&/buttermilk|butter milk/i.test(n))return false;
    if(/butter/i.test(label)&&/butter/i.test(n)){var Q=BUTQ;/*8-Sep: generated from matcher.BUTQ, was hand-typed here*/var lq=(label.match(Q)||[null])[0],nq=(n.match(Q)||[null])[0];if(String(lq).toLowerCase()!==String(nq).toLowerCase())return false;}
    if(/milk/i.test(label)&&!/condensed|milkmaid|coconut|chocolate|fermented|beverage/i.test(label)&&/condensed|milkmaid|coconut milk|chocolate|fermented|yakult|beverage|milk drink/i.test(n))return false;
    /* PARITY with matcher.py — A LABEL THAT NAMES A DERIVATIVE IS NOT IN ITS BASE'S TWIN CLASS.
       The class gate requires the row to carry the class word too. "Flattened Rice" contains the
       word rice, so it was forced into the rice class — and poha, the food it IS, carries no 'rice'
       and was rejected while BROWN RICE was allowed. Exactly backwards. Rule 103 draws this line for
       the row side; this draws it for the label side, with the same vocabulary. */
    var _tcActive=function(){var a=[];for(var ti=0;ti<TC.length;ti++){
      if(!TC[ti].test(label))continue;
      if(TC[ti].source==='rice'&&RICE_DERIV.test(label))continue;
      a.push(TC[ti]);}return a;};
    if(poolc){var _cls=_tcActive();
      if(opts.tcUnion){if(_cls.length&&!_cls.some(function(t){return t.test(n);}))return false;}
      else{for(var tj=0;tj<_cls.length;tj++){if(!_cls[tj].test(n))return false;break;}}}
    if(/black pepper|white pepper|peppercorn|pepper powder/i.test(label)&&/capsicum|bell pepper|shimla/i.test(n))return false;
    if(/capsicum|bell pepper|shimla/i.test(label)&&/pepper/i.test(n)&&!/capsicum|bell|shimla/i.test(n))return false;
    if((/drumstick|moringa/i.test(label)||/\bveg\b|\bveggies\b|vegetables?|\bsalad\b|\bsoup\b|\bsambar\b|\bavial\b|\bporiyal\b|\bthoran\b|\bsabzi\b|\bkootu\b|\bpalya\b/i.test(label))&&/\bchickens?\b|\bmuttons?\b|\blamb\b|\bgoat\b|\bprawns?\b|\bshrimps?\b|\blicious\b|\bkeema\b|\bbasa\b|\bpomfret\b|\bfreshtohome\b/i.test(n)&&!/chicken|prawn|fish|mutton|meat/i.test(label))return false;
    if(opts.freshGuard&&/tomato|onion|potato|cucumber|carrot|palak|spinach|methi|mint|coriander|bhindi|okra|cabbage|broccoli|mushroom|beans|capsicum|pepper|drumstick|avocado|amla|pomegranate|apple|kiwi|blueberry|orange|lettuce|sprout|cauliflower|peas/i.test(label)&&!spiceL&&!/\bfrozen\b|\bfroz\b/i.test(n)&&!(function(){var _h=LH.toLowerCase().replace(/[^a-z ]/g,'').trim();return _h.length>2&&new RegExp('(?<![a-z])'+_h+'e?s?(?![a-z])','i').test(n);})()&&opts.safeFn&&opts.safeFn(it)>30)return false;
    if(opts.expiredFn){try{if(opts.expiredFn(it)<=0)return false;}catch(e){}}
    return true;};}
var PP_DERIV_WORDS=[/\bseeds?\b/i,/\bsoftgels?\b/i,/\bcapsules?\b/i,/\btablets?\b/i,/\brubs?\b/i,/\bcakes?\b/i,/\brava\b/i,/\btari\b/i,/\bpodi\b/i,/\bkasuri\b|\bkasoori\b|\bqasuri\b|\bkasturi\s*methi\b/i];
var PP_VARIANTROW=[[/\bice\s*apple\b|\btaati\b|\bnungu\b|\bningu\b/i,"x"],[/\braw\s*banana\b|\bbaalekaayi\b|\bbalekayi\b|\bplantain\b/i,"x"],[/\bsweet\s*potato\b|\bgenasu\b|\bshakarkandi\b/i,"x"],[/\bwhite\s*pepper\b/i,"x"],[/\bjalapen[o0]\w*/i,"x"],[/\bblack\s*cardamom\b|\bbadi\s*elaichi\b/i,"x"],[/\bkalonji\b|\bnigella\b|\bblack\s*cumin\b|\bkala\s*jeera\b/i,"x"],[/\bblack\s*turmeric\b/i,"x"],[/\bfish\s*tamarind\b|\bkudam?puli\b|\bkodam?puli\b/i,"x"],[/\bcowpea\b|\bkaramani\b|\blobia\b|\bblack.?eyed\b/i,"x"],[/\bnutritional\s*yeast\b|\bnooch\b/i,"x"],[/\bcurd\s*chill?ie?s?\b|\bmor\s*milaga[iy]\b|\bdahi\s*mirch\b/i,"x"]];
var PP_BERRYNAMES=[[/\bblueberr\w*/i,"blueberry"],[/\bstrawberr\w*/i,"strawberry"],[/\bblackberr\w*/i,"blackberry"],[/\braspberr\w*/i,"raspberry"],[/\bcranberr\w*/i,"cranberry"],[/\bmulberr\w*/i,"mulberry"]];
var PP_OILNAMES=[[/\bsesames?\b|\bgingell?y\b|\btil\b/i,"sesame"],[/\bcoconut\b|\bnariyal\b|\bkopra\b/i,"coconut"],[/\bmustard\b|\bsarson\b|\brai\b|\bkachi\s*ghani\b/i,"mustard"],[/\bolives?\b/i,"olive"],[/\bgroundnuts?\b|\bpeanuts?\b|\bmoongphali\b/i,"groundnut"],[/\bsunflowers?\b/i,"sunflower"],[/\bcanola\b|\bconola\b|\brapeseed\b/i,"canola"],[/\brice\s*bran\b/i,"ricebran"],[/\bsoya?\b|\bsoybeans?\b/i,"soy"],[/\bpalm\b/i,"palm"],[/\balmonds?\b|\bbadam\b/i,"almond"],[/\bwalnuts?\b/i,"walnut"],[/\bflax\w*\b|\balsi\b/i,"flax"],[/\bavocado\b/i,"avocado"],[/\bcastor\b|\barandi\b/i,"castor"]];
var PP_RECONSTITUTES=[[/\bcoconut\s*milk\s*powder\b/i,/\bcoconut\s*milk\b/i],[/\btamarind\s*(paste|concentrate)\b/i,/\btamarind\b/i],[/\bvanilla\s*(bean\s*)?paste\b/i,/\bvanilla\b/i]];
var CHILLIFOOD=/chill?[iy]|mirchi|\bmirch\b/i;
var MIXPACK=/mixed pack|\s\+\s|\bjar set\b|\bspice set\b|\bgift set\b|\bcombo\b/i;
function ppResolve(pool,label,kws,opts){
  // Rule 46 guard: a mis-shaped pool used to resolve to [] in silence, which reads as
  // "no stock" rather than "bad call". Fail loudly instead.
  if(pool&&pool.length&&Array.isArray(pool[0])){
    try{console.error('ppResolve: pool entries must be {n,qty,unit}, got arrays',label);}catch(_){}
    pool=pool.map(function(e){return Array.isArray(e)?{n:e[0],qty:(e[1]&&e[1].qty)||e[1]||0,unit:(e[1]&&e[1].unit)||'g'}:e;});
  }
opts=opts||{};
  /* MEMO, keyed on the pool's IDENTITY plus label+keywords. ppExpandLiveNm calls ppResolve once per
     name in the last PHYSICAL COUNT, and every name that is not literally a pool row falls through to
     the alias-expansion pass — pool rows x expanded keywords x ~40 guard regexes each. That is why
     exactly the seven households with a recent large count (y16, y21, y24, y25, y26, y28, y29) timed
     gate_boards out at 120 s on the dashboard while y20, whose count is from 3-Aug, rendered in 15 ms.
     Two earlier attempts treated this as a constant-factor problem — hoisting label tests out of the
     row loop, then replacing a per-character regex in ppLB. Both were real improvements and neither
     moved the timeout, because the problem is the CALL COUNT.
     Cached ONLY when opts is empty: freshGuard/expiredFn/tcUnion change the answer, and expiredFn is
     a closure that cannot be part of a key. A copy goes in and a copy comes out, because callers sort
     the array they are handed. Pool identity means a rebuilt shelf gets a fresh cache for free. */
  var _rsK=null;
  if(!Object.keys(opts).length){
    var _c=ppResolve._c||(ppResolve._c={p:null,m:null});
    if(_c.p!==pool){_c.p=pool;_c.m=Object.create(null);}
    _rsK=String(label)+'\u0000'+String((kws||[label]).join('\u0001'));
    var _rsH=_c.m[_rsK];
    if(_rsH)return _rsH.slice();
  }
  var poolc=/curd|dahi|yogurt|\bmilk\b|paneer|butter|ghee|bread|pav|egg|atta|rice|oil|chicken|fish|prawn|mutton|\bdals?\b|\blentils?\b/i.test(label)
    /* RULE 74 — a BASKET of alternatives pools across ALL its keywords, like a commodity pools
       across brands. Stopping at the first keyword that matched is right for synonyms of one
       ingredient and wrong for a list of acceptable substitutes: Nalin's "French Beans 100 g /
       540 g / short 440 g" was two generic veg baskets pinned to the first bean row, blind to
       Cauliflower 450 g and Green Peas 250 g. Ported from matcher.POOLB — keep the two in step. */
    || (/\bmixed veg\w*|\bvegetables?\b|\bveggies\b|\bsalad veg\b|\bfruit\b|\bmixed dal\b|\bmixed greens\b|\bmixed seeds\b|\bsalad\b/i.test(label) && (kws||[]).length>=3)/* 23-Aug: A LABEL THAT NAMES ONE FOOD POOLS ACROSS EVERY ROW OF THAT FOOD. Jayant had 400 g of okra and a Bhindi need reached a row holding 0 g, so Handover asked him to buy it. Neither POOLC nor POOLB covers a plain vegetable, so the need took ONE row instead of all of them. Pool when the keywords touch exactly ONE alias group — one group is one food under several names. Python twin: matcher.resolve + aliases.groups_hit; Rule 66h proves they agree. */ || ppGroupsHit([String(label).toLowerCase()])===1;/* 28-Aug: ASK THE LABEL, NOT THE EXPANDED KEYWORDS. kws arrives from expand(), whose whole job is to widen a label into every related group's terms — so the set contained, by construction, exact members of every group expand had pulled in, and the count was 2 whenever a label's group overlapped another. Ten everyday labels were in that state (green chilli, red chilli powder, tender coconut, hung curd, ragi atta, kali mirch, shimla mirch, patta gobhi). The ambiguity was manufactured by the widening. Python twin: matcher.resolve. */
  function run(union){var hits=[];var o={};for(var kk in opts)o[kk]=opts[kk];o.tcUnion=union;
    var ok=ppOkFactory(label,o);
    kws.some(function(k){k=String(k).toLowerCase();var got=false;
      pool.forEach(function(it){if(ppLB(ppPkgStrip(it.n).toLowerCase(),k)&&ok(it)&&hits.indexOf(it)<0){hits.push(it);got=true;}});
      return got&&!poolc;});
    /* A ZERO-QTY NAMESAKE ROW MUST NOT SUPPRESS THE ALIAS PASS. 30-Aug.
       This asked `if(!hits.length)` — the alias expansion ran only when the strict pass found NOTHING.
       A row whose name IS the label always hits, so a household holding the food under a second name
       never reached it once the namesake row went empty:
         Dhanush & Srishti   Red Chilli Powder          0 g   <- strict hit, hits is non-empty
                             Kashmiri Lal Mirch Powder 26 g   <- never reached, board said "not available"
       ppLB('kashmiri lal mirch powder','red chilli powder') is false, so only expandKws can bridge the
       two names — and it was gated behind the very row that made the bridge necessary. This is the
       lb()-FINDS arm, not the ok() JUDGES arm: ppOkFactory('Red chilli powder') already accepts the
       Kashmiri row. The question the fallback is really asking is "did the strict pass reach any
       STOCK", not "any ROW" — the same question in the same words as the union retry just below. The
       0 g row stays in hits and sorts under the stocked one. Python twin: matcher.resolve (Rule 66h). */
    if(!hits.some(function(x){return (x.qty||0)>0;})){var xk=(typeof expandKws==='function')?expandKws(kws):kws;
      pool.forEach(function(it){var n=ppPkgStrip(it.n).toLowerCase();
        if(xk.some(function(k){return ppLB(n,String(k).toLowerCase());})&&ok(it)&&hits.indexOf(it)<0)hits.push(it);});}
    return hits;}
  var hits=run(false);
  if(!hits.some(function(x){return (x.qty||0)>0;})){var u=run(true);if(u.some(function(x){return (x.qty||0)>0;})||!hits.length)hits=u;}
  hits.sort(function(a,b){return (b.qty||0)-(a.qty||0);});
  if(_rsK&&ppResolve._c)ppResolve._c.m[_rsK]=hits.slice();
  return hits;}
const GPP={"Apple": 170, "Apple (Royal Gala)": 170, "Avocado": 165, "Banana": 150, "Banana (Yellaki)": 55, "Beetroot": 150, "Brinjal": 90, "Broccoli": 350, "Carrot": 80, "Cucumber": 200, "Guava": 300, "Guava (white, premium)": 300, "Kiwi": 95, "Kiwi (green)": 95, "Lemon": 60, "Mango": 200, "Mango (ripe)": 200, "Onion": 100, "Orange": 195, "Pear": 180, "Pear (Sweet Beauty Red)": 180, "Pear (blue)": 180, "Pomegranate": 225, "Potato": 100, "Sweet corn": 250, "Sweet corn (frozen)": 250, "Sweet potato": 150, "Tomato": 80, "Yelakki banana": 55, "Yellaki banana": 55, "Zucchini": 175};
function ppIsPc(u){u=String(u==null?'':u).trim().toLowerCase();
  return u==='pc'||u==='pcs'||u==='piece'||u==='pieces'||u==='no'||u==='nos';}
function _toG(n,v){var g=GPP[n];if(g&&v>0&&v<30)return v*g;return v;}
var PP_MSTOP={organically:1,grown:1,organic:1,fresh:1,farm:1,farms:1,by:1,pack:1,packet:1,pouch:1,the:1,premium:1,natural:1,naturally:1,handpicked:1,select:1,from:1,with:1,and:1,of:1,peeled:1,jar:1,jars:1,loose:1,sealed:1,opened:1,unopened:1,backup:1,spare:1,tub:1,punnet:1,basket:1,box:1,tin:1,packets:1,sachet:1,sachets:1,cup:1,cups:1,container:1,containers:1,plate:1,mug:1,glass:1,plastic:1,steel:1,refill:1,new:1,old:1,kashmiri:1,licious:1};
var PP_MBLOCK={cranberry:1,cherry:1,cocktail:1,spring:1,sweet:1,dry:1,dried:1,frozen:1,puffed:1,cooked:1,roasted:1,black:1,brown:1,red:1,leafy:1,haricot:1,kasuri:1,fruit:1,cold:1,instant:1,filter:1,baby:1,split:1,buttermilk:1,shallot:1,powder:1,paste:1,sauce:1,ketchup:1,spicy:1,chip:1,juice:1,flour:1,oil:1,pickle:1,masala:1,milk:1,coconut:1,almond:1,soy:1,soya:1,oat:1,tender:1,rock:1,khapli:1,emmer:1,mixed:1,ajwain:1};
var PP_MNEG={zero:1};
var PP_MIES={"chillies": "chilli", "chilies": "chili", "idlies": "idli", "roties": "roti"};
var PP_FOODW={adobo:1,ajwain:1,all:1,almond:1,aloe:1,amaranth:1,amchur:1,amino:1,amla:1,anchovie:1,anchovy:1,anise:1,apple:1,apricot:1,aquafaba:1,arrowroot:1,arugula:1,asafoetida:1,ash:1,asparagu:1,atar:1,avocado:1,baby:1,badi:1,bael:1,bag:1,bagel:1,baking:1,balsamic:1,bamboo:1,banana:1,barbecue:1,barley:1,barnyard:1,basa:1,basil:1,basmati:1,bathua:1,bay:1,bean:1,beef:1,beetroot:1,bell:1,berrie:1,betel:1,bhaji:1,bird:1,bitter:1,black:1,blueberrie:1,blueberry:1,bok:1,bonnet:1,boondi:1,bottle:1,brazil:1,bread:1,breadcrumb:1,breast:1,brinjal:1,broccoli:1,broken:1,broth:1,brown:1,brussel:1,buckwheat:1,bud:1,butter:1,buttermilk:1,butternut:1,cabbage:1,cajun:1,candlenut:1,cardamom:1,carom:1,carrot:1,cashew:1,cauliflower:1,cayenne:1,celery:1,chaat:1,chana:1,chayote:1,cheddar:1,cheese:1,cherrie:1,cherry:1,chestnut:1,chettinad:1,chia:1,chicken:1,chickpea:1,chicory:1,chikoo:1,chili:1,chilie:1,chilli:1,chillie:1,chip:1,chipotle:1,chive:1,chocolate:1,choy:1,chunk:1,chutney:1,cider:1,cinnamon:1,clove:1,cocoa:1,coconut:1,coffee:1,condensed:1,coriander:1,corn:1,cornstarch:1,cotija:1,cowpea:1,cranberrie:1,cream:1,crouton:1,cucumber:1,culantro:1,cumin:1,curd:1,curry:1,custard:1,dal:1,dark:1,date:1,dijon:1,dill:1,dragon:1,dried:1,drumstick:1,dry:1,edamame:1,egg:1,eggplant:1,elephant:1,eno:1,extract:1,eye:1,fennel:1,fenugreek:1,feta:1,fig:1,fish:1,flake:1,flattened:1,flax:1,flour:1,free:1,french:1,fruit:1,galangal:1,garam:1,garlic:1,gelatin:1,ghee:1,ghost:1,giloy:1,ginger:1,gluten:1,gochugaru:1,goda:1,gongura:1,gourd:1,gram:1,granola:1,grape:1,greek:1,green:1,guava:1,gulkand:1,gyoza:1,harissa:1,heavy:1,herb:1,honey:1,horlick:1,horse:1,hot:1,hung:1,husk:1,ice:1,idli:1,in:1,indonesian:1,ivy:1,jackfruit:1,jaggery:1,jalapeno:1,jam:1,jamun:1,jasmine:1,jowar:1,juice:1,kaffir:1,kaima:1,kale:1,kapok:1,kashmiri:1,kasoori:1,kasuri:1,ketchup:1,kewra:1,khapli:1,khoya:1,kidney:1,kiwi:1,kohlrabi:1,kokum:1,kolam:1,kudampuli:1,leaf:1,leave:1,leek:1,lemon:1,lemongras:1,lentil:1,lettuce:1,lime:1,litchi:1,liver:1,lobia:1,macaroni:1,mace:1,mackerel:1,maize:1,makhana:1,malabar:1,mandarin:1,mango:1,maple:1,masala:1,masoor:1,masoori:1,massaman:1,matcha:1,matta:1,mayonnaise:1,melon:1,methi:1,milk:1,millet:1,mince:1,mint:1,miso:1,mix:1,mixed:1,moong:1,moringa:1,mosambi:1,moth:1,msg:1,muesli:1,multigrain:1,mushroom:1,musk:1,mustard:1,mutton:1,nannari:1,neem:1,nigella:1,noodle:1,nugget:1,nut:1,nutmeg:1,oat:1,oil:1,okra:1,olive:1,onion:1,or:1,orange:1,oregano:1,oyster:1,palm:1,panch:1,pandan:1,paneer:1,panko:1,papad:1,papaya:1,paper:1,paprika:1,parmesan:1,parsley:1,pasta:1,paste:1,pastry:1,pav:1,pea:1,peach:1,peanut:1,pear:1,pearl:1,pecan:1,peppadew:1,pepper:1,peppercorn:1,peri:1,phalsa:1,phoran:1,pickle:1,pine:1,pineapple:1,pinto:1,pistachio:1,pizza:1,plum:1,pod:1,podi:1,pointed:1,pomegranate:1,pomfret:1,poppy:1,pork:1,potato:1,powder:1,prawn:1,protein:1,prune:1,psyllium:1,puff:1,pumpkin:1,puree:1,purpose:1,quinoa:1,radish:1,ragi:1,raisin:1,rasam:1,raspberry:1,raw:1,red:1,rennet:1,rice:1,ridge:1,roasted:1,roll:1,romaine:1,root:1,rose:1,rosemary:1,rye:1,s:1,sabja:1,saffron:1,salmon:1,salt:1,samba:1,sambar:1,sardine:1,sattu:1,sauce:1,schezwan:1,scotch:1,seasoning:1,seed:1,seeraga:1,semolina:1,sesame:1,sev:1,shallot:1,shaoxing:1,shiitake:1,shirataki:1,shoot:1,shrimp:1,sichuan:1,skim:1,skyr:1,smoked:1,snap:1,soda:1,sona:1,sorghum:1,sour:1,sourdough:1,soy:1,soya:1,spaghetti:1,spice:1,spinach:1,spine:1,spiny:1,spring:1,sprout:1,squash:1,sriracha:1,star:1,starch:1,starter:1,stick:1,sticky:1,stock:1,strawberrie:1,strawberry:1,sugar:1,sugarcane:1,sumac:1,sunflower:1,sweet:1,syrup:1,taco:1,tahini:1,tamari:1,tamarind:1,tandoori:1,tapioca:1,taro:1,tea:1,tempeh:1,tendli:1,thai:1,thyme:1,tilapia:1,tinda:1,tofu:1,tomato:1,toor:1,tortilla:1,tulsi:1,tuna:1,turmeric:1,tzatziki:1,urad:1,vanilla:1,vegan:1,vegetable:1,vera:1,vermicelli:1,vinegar:1,walnut:1,water:1,watermelon:1,wheat:1,wheatgras:1,whipped:1,white:1,whole:1,wine:1,worcestershire:1,wrap:1,wrapper:1,yam:1,yardlong:1,yeast:1,yellow:1,yogurt:1,yolk:1,za:1,zest:1,zucchini:1};
var PP_PRODTYPE={batter:1,biscuit:1,butter:1,buttermilk:1,candy:1,cheese:1,chip:1,chutney:1,concentrate:1,cream:1,crisp:1,curd:1,drink:1,essence:1,fermented:1,flavored:1,flavoured:1,flour:1,ghee:1,jam:1,juice:1,lassi:1,masala:1,paste:1,pickle:1,powder:1,sauce:1,seed:1,shake:1,skyr:1,soya:1,squash:1,sweetened:1,syrup:1,tofu:1,vinegar:1,wafer:1,yoghurt:1,yogurt:1};
var PP_PIECEG={"chicken sausage": 50, "sausage (chicken)": 50, "sausage": 50, "bun": 60, "garlic bun": 60, "ginger": 25, "bitter gourd": 100, "karela": 100, "pomfret": 250, "chicken breast": 400, "khakra": 13, "khakhra": 13, "radish": 200, "mooli": 200, "french beans": 5, "french bean": 5, "haricot beans": 5, "dried figs": 15, "dried fig": 15, "anjeer": 15, "lettuce": 200, "cheese cube": 18.75, "cheese slice": 20, "bhindi": 10, "okra": 10, "lady's finger": 10, "ladyfinger": 10, "lady finger": 10, "ladies finger": 10, "bell pepper": 120, "bellpepper": 120, "green chilli": 5, "green chillies": 5, "hari mirch": 5, "hasiru menasinakaayi": 5, "cherry tomato": 15, "cherry tomatoes": 15, "zucchini": 200, "musk melon": 900, "musk mellon": 900, "english cucumber": 150, "amla": 33, "avla": 33, "ridge gourd": 200, "pumpkin": 1000, "baby corn": 20, "mosambi": 120, "sweet lime": 120, "pear": 180, "garlic": 30, "cream": 200, "yelakki banana": 60, "yellaki banana": 60, "elakki banana": 60, "orange": 130, "mandarin": 100, "apple": 180, "banana": 125, "papaya": 1000, "dragon fruit": 350, "guava": 250, "custard apple": 275, "avocado": 150, "kiwi": 80, "lemon": 40, "pomegranate": 250, "watermelon": 2500, "coconut": 400, "cucumber": 200, "capsicum": 120, "onion": 100, "tomato": 80, "potato": 100, "drumstick": 55, "corn": 250, "egg": 50, "cauliflower": 600, "broccoli": 250, "cabbage": 800, "bottle gourd": 700, "lauki": 700, "brinjal": 90, "beetroot": 150, "carrot": 80, "pineapple": 900, "muskmelon": 900, "sweet potato": 150, "bread": 400, "baby bottle gourd": 400, "baby lauki": 400};
var PP_PIECEG_W={"chicken sausage": 50, "sausage (chicken)": 50, "garlic bun": 60, "ginger": 25, "bitter gourd": 100, "pomfret": 250, "chicken breast": 400, "radish": 200, "french beans": 5, "french bean": 5, "haricot beans": 5, "dried figs": 15, "dried fig": 15, "lettuce": 200, "cheese cube": 18.75, "cheese slice": 20, "bhindi": 10, "okra": 10, "bell pepper": 120, "bellpepper": 120, "green chilli": 5, "green chillies": 5, "cherry tomato": 15, "cherry tomatoes": 15, "zucchini": 200, "musk melon": 900, "english cucumber": 150, "amla": 33, "ridge gourd": 200, "pumpkin": 1000, "baby corn": 20, "mosambi": 120, "sweet lime": 120, "pear": 180, "garlic": 30, "cream": 200, "yelakki banana": 60, "yellaki banana": 60, "elakki banana": 60, "orange": 130, "apple": 180, "banana": 125, "papaya": 1000, "dragon fruit": 350, "guava": 250, "custard apple": 275, "avocado": 150, "kiwi": 80, "lemon": 40, "pomegranate": 250, "watermelon": 2500, "coconut": 400, "cucumber": 200, "capsicum": 120, "onion": 100, "tomato": 80, "potato": 100, "drumstick": 55, "corn": 250, "cauliflower": 600, "broccoli": 250, "cabbage": 800, "bottle gourd": 700, "lauki": 700, "brinjal": 90, "beetroot": 150, "carrot": 80, "pineapple": 900, "sweet potato": 150, "bread": 400, "baby bottle gourd": 400, "baby lauki": 400};
var PP_SCRAP_G=50;
var PP_SPLIT=[{rx:/(?=.*(?:capsicum|bell\s*pepper))(?=.*(?:tricolour|tri[\s-]*colour|tri[\s-]*color|assorted|mixed))/i,into:[['Green Capsicum',0.3333333333333333],['Red & Yellow Bell Peppers',0.6666666666666666]]}];
var PP_SYN=[["black gram","urad"],["black pepper","peppercorn"],["bottle gourd","lauki"],["chana (kabuli","chickpea"],["chickpea flour","besan"],["curry leave","karibevu"],["flattened rice","avalakki"],["fresh cream","malai"],["gram flour","besan"],["greek yogurt","skyr"],["green gram","moong"],["hung curd","skyr"],["kabuli chana","chickpea"],["kabuli channa","chickpea"],["kadi patta","karibevu"],["kali mirch","peppercorn"],["kidney bean","rajma"],["lady finger","okra"],["lady' finger","okra"],["patta gobhi","cabbage"],["red lentil","masoor"],["wheat flour","atta"],["white chana","chickpea"],["adrak","ginger"],["akki","rice"],["aloo","potato"],["anar","pomegranate"],["anda","egg"],["aubergine","brinjal"],["baingan","brinjal"],["batata","potato"],["beed","bread"],["bellulli","garlic"],["bhindi","okra"],["carom","ajwain"],["chaa","buttermilk"],["chawal","rice"],["chhole","chickpea"],["chilli","chili"],["chilly","chili"],["chole","chickpea"],["chukandar","beetroot"],["cilantro","coriander"],["daal","dal"],["dahi","curd"],["dalchini","cinnamon"],["dhania","coriander"],["eggplant","brinjal"],["elaichi","cardamom"],["gajar","carrot"],["gobhi","cauliflower"],["gobi","cauliflower"],["groundnut","peanut"],["gud","jaggery"],["haldi","turmeric"],["hing","asafoetida"],["imli","tamarind"],["jeera","cumin"],["jhinga","prawn"],["kanda","onion"],["kheera","cucumber"],["kothimbir","coriander"],["ladyfinger","okra"],["lehsun","garlic"],["lime","lemon"],["majjige","buttermilk"],["methi","fenugreek"],["mirch","chili"],["mirchi","chili"],["moongphali","peanut"],["moringa","drumstick"],["mung","moong"],["nariyal","coconut"],["nimbe","lemon"],["nimbu","lemon"],["nuggekai","drumstick"],["palak","spinach"],["pav","bread"],["poha","avalakki"],["pudina","mint"],["pyaaz","onion"],["pyaz","onion"],["rai","mustard"],["rava","semolina"],["sarson","mustard"],["saunf","fennel"],["semiya","vermicelli"],["seviyan","vermicelli"],["shallot","onion"],["shrimp","prawn"],["shunti","ginger"],["sooji","semolina"],["sorekai","lauki"],["sowthekaayi","cucumber"],["suji","semolina"],["tamatar","tomato"],["thenginakayi","coconut"],["tuppa","ghee"],["yelakki","elakki"],["yellaki","elakki"],["yoghurt","skyr"],["yogurt","skyr"]];
function ppMNorm(s){s=String(s||'').toLowerCase();
  /* SIZE GRADES, dropped as PHRASES. y14 held "Pomegranate" 425 g fresh and "Pomegranate King Size"
     2102 g fully expired as TWO commodities, so the dashboard's Pomegranate card said "none expired"
     while the Smart list — which resolves the label across both — said "partial". ppMPair can only
     merge when the shorter name is a SUFFIX of the longer, so a qualifier AFTER the food can never
     merge, whatever is in PP_MBLOCK. Dropping it here instead is what makes the two names one key.
     Deliberately a PHRASE, not stop words: 'king' alone would turn "King Fish" into "fish", and
     'size' alone leaves "pomegranate king". A size grade is not a different food; a species is. */
  /* RED ONION IS ONION (Jayant, 21-Aug). A PHRASE, never by removing 'red' from PP_MBLOCK --
     that word keeps red chilli out of chilli and red rice out of rice. */
  s=s.replace(/\bred\s+onion(s)?\b/g,'onion');
  /* NOMENCLATURE, 24-Aug. Jayant: *"oniom, red onion and shellout same / coconut and coconut chunks
     are / lady finger, okra, bhindi same"*. Three groups where ONE food wore several names and the
     board therefore drew several chips. The resolver already pooled all three (ppGroupsHit==1, the
     23-Aug pooling fix) -- this is the GROUPING layer, which merges only when the shorter name is a
     trailing SUFFIX of the longer. "Okra" and "Lady Finger" share no letters, so no table of
     qualifiers could ever have joined them. Measured before the fix, one household's three rows:
         Lady Finger=85g | Okra=400g | Ladyfinger=20g        three cards, three verdicts
     Phrases, for the same reason 'red' was never removed from PP_MBLOCK: the qualifier words must go
     on blocking elsewhere. 'small' still keeps small cardamom apart, 'brown' still keeps brown rice
     apart; only these exact phrases collapse. */
  s=s.replace(/\blady\s*'?s?\s*finger(s)?\b/g,'okra').replace(/\bbhindi\b/g,'okra')
     .replace(/\bvendakka(i)?\b/g,'okra').replace(/\bbendekai\b/g,'okra');
  /* SAMBAR / SMALL / PEARL ONION IS A SHALLOT, AND JAYANT SAYS A SHALLOT IS AN ONION.
     This REVERSES a 21-Aug decision recorded in matcher.py and in PP_MBLOCK's 'shallot' entry, and
     the reversal is his to make -- but it only holds if BOTH layers move together. The reason that
     guard was written is in its own comment: with red onion pooled and shallot not, vs204's onion
     CARD read wholly expired on 580 g of red onion while the Smart LIST still counted 150 g of fresh
     sambar onion and read 'partial'. Two boards, both right, one label spanning two foods. So the
     matching guard in matcher.py comes out in the same change as this phrase. Leaving either alone
     re-creates that split with the sides swapped. */
  s=s.replace(/\b(sambar|small|pearl|madras)\s+onion(s)?\b/g,'onion').replace(/\bshallot(s)?\b/g,'onion');
  /* COCONUT CHUNKS IS COCONUT. 'chunk' sits AFTER the food, and ppMPair can only merge a shorter
     name that is a trailing suffix, so "Coconut Chunks" could never join "Fresh Coconut" however the
     tables were written -- the same shape as "Pomegranate King Size" above. Grated and desiccated go
     with it: a cut is not a different food. MILK, OIL, POWDER AND SUGAR ARE NOT TOUCHED and must not
     be; they stay their own commodities, and matcher.py's PROCESSED_FORMS now enforces the same on
     the resolver side so a grated-coconut need can no longer be answered out of a milk carton. */
  /* YELLOW AND RED CAPSICUM ARE BELL PEPPER; GREEN CAPSICUM IS CAPSICUM.
     Jayant, 1-Sep: *"yellow capsicum should hqave diff card as bell papper"*, then *"yellow and red
     both caspicum as bell papper"*. Two foods wearing one word: the green one is what goes in Indian
     cooking and the coloured ones are a different shopping decision, so they are two cards.

     WHAT WAS ACTUALLY WRONG, because it was not what it looked like. Green and yellow do NOT merge
     with each other -- ppMPair refuses them (same token length, neither a suffix of the other) and
     ppMSameFood refuses them too. y36 held a THIRD row, `Capsicum` at 0 g, whose key is a suffix of
     both `green capsicum` and `yellow capsicum` with the extra word blocked by neither -- so the
     empty row merged with each colour and the union-find joined green to yellow THROUGH it. Red
     escaped only because 'red' is in PP_MBLOCK. An empty namesake row bridging two real ones is the
     same shape as the 30-Aug alias-fallback bug, one layer over.

     A PHRASE, NOT A BLOCK WORD, and the difference is measured. Adding 'yellow' to PP_MBLOCK would
     have split Yellow Capsicum off correctly and ALSO split y24's "Yellow Sweet Corn" (100 g) from
     its "Sweet corn" -- and yellow sweet corn is sweet corn. Same argument the RED ONION comment
     above makes for keeping 'red' in PP_MBLOCK and doing onions by phrase. Rewriting to a shared key
     also does what a block word cannot: it PUTS RED AND YELLOW TOGETHER, which is what was asked
     for. Green stays `capsicum`, and a parenthetical colour is stripped two lines below, so
     "Capsicum (Green Bell Pepper)" is still capsicum. */
  s=s.replace(/\b(red|yellow)(\s*(?:&|and)\s*(?:red|yellow))?\s+(?:capsicum|bell\s*pepper)(s)?\b/g,'bell pepper');
  /* AND THE COLOUR AFTER THE NOUN. y27 spells it "Capsicum Red & Yellow" and the rule above wants
     the colour first, so that household alone kept a card reading "Capsicum Red & Yellow" while
     every other one read "Bell pepper". Same food, same rewrite, both word orders. */
  s=s.replace(/\b(?:capsicum|bell\s*pepper)s?\s+(red|yellow)(\s*(?:&|and)\s*(?:red|yellow))?\b/g,'bell pepper');
  /* SWEET CORN IS CORN, and the two boards said so differently. y36, 8-Sep: `Corn` 500 g counted
     5-Sep sat in one chip and `Nectr Fresh Veggies Sweet Corn` 812 g counted 2-Sep in another, so
     the dashboard drew a "Sweet corn" card reading wholly expired beside a fresh "Corn" card while
     the Smart list -- whose need resolves across BOTH rows -- said "partial". Rule 129 refused the
     bake on the disagreement. Exactly the POMEGRANATE KING SIZE shape above, one qualifier earlier:
     'sweet' is in PP_MBLOCK so ppMPair can never merge them, while the resolver pools them anyway --
     matcher.py carries the bare 'corn' keyword for the sweet-corn family PRECISELY so that y36's
     `Corn` is not stranded, and says so by name. The two pooling layers disagreeing is the defect;
     the data is right and neither row may be touched (a partial count on 5-Sep re-clocked only one
     of them, so the 812 g is genuinely older, not a duplicate).

     A PHRASE, never by removing 'sweet' from PP_MBLOCK, which must go on keeping sweet potato out of
     potato and sweet lime out of lime. Frozen keeps its own card: 'frozen' is still a block word and
     Master FnV prices frozen sweet corn as a 180 d Staple against 6 d for the vegetable. Baby corn is
     untouched, as matcher.py's BABYCORN insists, and the derivatives never reached here anyway --
     "Corn Flour"/"Corn Starch" put the qualifier AFTER the noun, which ppMPair cannot merge. */
  s=s.replace(/\bsweet\s+corn(s)?\b/g,'corn');
  s=s.replace(/\bking\s*size\b/g,' ').replace(/\bfamily\s*pack\b/g,' ').replace(/\bvalue\s*pack\b/g,' ');
  s=s.replace(/\([^)]*\)/g,' ').replace(/\b(y|h|c|vs)\d{1,4}\b/g,' ').replace(/[^a-z ]+/g,' ');
  /* THE COCONUT CUT WORDS, applied HERE and not with the phrases above, because two of the four
     real spellings only survive the punctuation strip: "Fresh Coconut, halved" carries a comma and
     "Grated Coconut (y27 self)" puts the cut word FIRST. Both orders are matched for that reason.
     A cut is not a different food -- chunks, halves and gratings of a mature coconut are one
     commodity, and this is the same argument as "Pomegranate King Size" above. BROWN is included
     because a brown coconut IS the mature coconut; it is spelled out rather than removed from
     PP_MBLOCK, which must go on keeping brown rice out of rice. TENDER COCONUT IS NOT HERE and must
     not be -- it is a different food with its own alias group, which is why 'tender' is absent from
     every alternation below. Milk, oil, powder and sugar are likewise untouched. */
  s=s.replace(/\b(chunks?|pieces?|halves|halved|half|grated|desiccated|shredded|scraped|brown|mature)\s+coconut\b/g,'coconut')
     .replace(/\bcoconut\s+(chunks?|pieces?|halves|halved|half|grated|desiccated|shredded|scraped)\b/g,'coconut');
  /* JAYANT'S RULINGS, 25-Aug, given item by item when I asked which of eight ambiguous pairs were
     one food: *"English Cucumber vs Green Cucumber - both same / Desi Tomato vs Hybrid Tomato both
     same / light vs dark Soy Sauce - both same / Buffalo Ghee vs Desi Ghee - both same / Chitra
     Rajma vs Red Rajma -both same / Split Moong Dal vs Whole Green Moong - both same"*.
     These are VARIETY and GRADE words, not different foods, so they drop as phrases — the same
     treatment 'red onion' got on 21-Aug, and again never by removing the word from PP_MBLOCK, which
     must go on keeping brown rice out of rice and sweet potato out of potato.
     NOTE ON THE LAST ONE, because it is wider than it looks: ruling that split moong dal and whole
     green moong are one food also merges c204's "Green Moong" with its "Yellow Moong Dal", which I
     had listed for him as a pair to LEAVE ALONE. Hulled-and-split versus whole-with-skin cook
     differently, so I would not have merged them unasked; his ruling is the same judgement applied
     consistently, and applying it to one pair and not the other would be incoherent. */
  s=s.replace(/\b(english|green|hasiru|soutekaayi|desi|country|nati)\s+cucumber\b/g,'cucumber')
     .replace(/\bcucumber\s+(green|english)\b/g,'cucumber');
  s=s.replace(/\b(desi|hybrid|country|nati|indian)\s+tomato\b/g,'tomato');
  s=s.replace(/\b(light|dark|premium)\s+soy\s+sauce\b/g,'soy sauce');
  s=s.replace(/\b(buffalo|desi|cow|danedar|daneed|granular)\s+ghee\b/g,'ghee');
  /* CHILLI VARIETIES ARE ONE CARD, AND 'RED' MUST SURVIVE. 28-Aug, Jayant: *"on dashboard i still
     seeing 2 card for Red Chilli Powder and Kashmiri Lal Mirch Powder"*. The matching fix earlier
     today made a chilli-powder NEED find both rows; the CARDS are a separate layer and it had not
     learned the vocabulary. The keys were [red chili powder] and [kashmiri lal chili powder].
     'lal' and 'laal' ARE the Hindi word for red, so they are TRANSLATED, not dropped — 'red' is in
     PP_MBLOCK deliberately ("keeps red chilli out of chilli and red rice out of rice", 21-Aug), so
     stripping it would merge red chilli powder into plain chilli powder and, worse, let a green
     chilli powder card absorb a red one. Translating makes both rows say red and they meet there. */
  s=s.replace(/\b(laal|lal|byadgi|byadagi|guntur|degi)\b/g,'red');
  /* byadgi, byadagi, guntur and degi are RED chilli varieties, so they translate to red like
     'lal' rather than dropping — dropping cost them their colour and left MTR Prakriti Byadagi
     Chilli Powder on its own card. 'kashmiri' is NOT here on purpose: it qualifies rajma too,
     and translating it would put a blocking qualifier on "Kashmiri Rajma" and stop it meeting
     plain Rajma. It stays a stop word, which is right for both foods. */
  s=s.replace(/\b(chitra|red|kashmiri|jammu|dark)\s+rajma\b/g,'rajma')
     .replace(/\brajma\s+(chitra|kashmiri|jammu)\b/g,'rajma');
  /* MOONG QUALIFIERS STRIP REPEATEDLY, not once. "Moong Dal Chilka" carries TWO of them and a single
     pass only ate the first: 'moong dal' became 'moong' and ' chilka' was left behind, so y29's
     "Moong Dal Chilka (split green gram)" kept its own card away from "Green moong (whole)" — the two
     cards Jayant reported. The + on the group handles any number of them in either order. */
  s=s.replace(/\b(split|whole|green|yellow|dhuli|chilka|sabut)\s+moong\b/g,'moong')
     .replace(/\bmoong(\s+(split|whole|chilka|dal|dhuli|sabut))+\b/g,'moong');
  var w=s.split(/\s+/),t=[];
  for(var i=0;i<w.length;i++){var x=w[i];if(!x||PP_MSTOP[x])continue;
    /* -IES IS NOT ALWAYS THE PLURAL OF -Y. "chillies" is the plural of "chilli", so the generic
       -ies -> -y rule keyed it as "chilly" — a token no chilli row can ever equal. Measured on the
       live workbook: 16 rows across 11 households landed on "green chilly" or "dried red chilly".
       Sanatha & Sai therefore held "Green Chilli" 15 g and "Green Chillies" 112.4 g as TWO
       commodities, two cards, two verdicts; and a needs label of "green chilli" reached neither of
       the plural rows, so the Smart list could ask for chilli with 112 g of it on the shelf. Same
       shape as the -oes bug below, from the other end of the word.
       DECLARED, not inferred: -ies from an -i stem is a loanword pattern with no reliable rule, so
       the list grows as one is found rather than guessing at English. The synonym pass downstream
       still folds chilli -> chili, which is why the corrected token lands on the same key. */
    if (PP_MIES[x]) x = PP_MIES[x];
    else x=x.replace(/ies$/,'y');
    if(/[^s]s$/.test(x))x=x.slice(0,-1);
    /* THE -OES PLURAL. Stripping one trailing 's' turns "tomatoes" into "tomatoe", which can never
       equal "tomato", so the key SPLIT one food into two commodities — and therefore two dashboard
       cards, two verdicts, and a needs board that pooled both and agreed with neither. Measured on
       the live workbook this splits 15 commodities across 12 of the 14 households: tomato/tomatoe in
       10 of them and potato/potatoe in 5. y29 is the one Jayant can see today — "Tomato" 206 g fresh
       on one card and "Tomatoes" 185 g fully expired on another, while the Smart list pools the two
       into "391 g, 185 of 391 g expired". Collapsing the bare -oe left by the 's' strip is the whole
       fix; -es after a sibilant ("boxes", "dishes") already survives the first rule intact, and a
       word that genuinely ends in -oe ("aloe") normalises the same way on both sides of every
       comparison, so grouping stays self-consistent. */
    x=x.replace(/oe$/,'o');
    t.push(x);}
  /* REPEATED TOKENS COLLAPSE. "Shallots / Sambar Onions" names the same food twice, and after the
     shallot phrase it normalised to the key "onion onion" -- which equals no other row, so the very
     merge the phrase was added for still did not happen. A key is a SET of food words; saying onion
     twice does not make a second commodity. Order is preserved so the suffix test in ppMPair is
     unaffected. */
  /* RULE 147 — THE SYNONYM PASS RUNS HERE, after the stop words and after singularisation, and
     over TOKENS rather than the raw string. Both of those are bug fixes, each found by the diff:
       * BEFORE tokenising it chained. "ragi flour" became "ragi atta" by one group and then 'atta'
         became "wheat flour" by another, so a ragi row normalised to "ragi wheat flour" and
         suffix-merged with plain Wheat Flour. Two different grains, one card. Rewriting each token at
         most once removes the chain by construction.
       * BEFORE singularising it split what it was meant to join. The keys are singular, so "Potato"
         was rewritten and "Potatoes" was not, and y27's "Potatoes" stopped sharing a card with its
         own "Ooty Potato" -- a merge that had been correct before I touched anything.
     The map itself is built with a UNION-FIND in inventory.py, because aliases.json holds BOTH
     ["potato","aloo","batata"] AND ["aloo","potato"]; taking each group's first member gave the
     contradictory pair potato->aloo and aloo->potato. Overlapping groups are one set with one
     canonical, and that canonical is the Recipe Master's own word (see PP_SYN's note). */
  var _tk=[];
  for(var _a=0;_a<t.length;_a++){
    var _hit=null;
    for(var _b=3;_b>=1&&!_hit;_b--){
      if(_a+_b>t.length)continue;
      var _ph=t.slice(_a,_a+_b).join(' ');
      for(var _c=0;_c<PP_SYN.length;_c++)if(PP_SYN[_c][0]===_ph){_hit=[PP_SYN[_c][1],_b];break;}
    }
    if(_hit){var _p=String(_hit[0]).split(' ');for(var _d=0;_d<_p.length;_d++)_tk.push(_p[_d]);_a+=_hit[1]-1;}
    else _tk.push(t[_a]);
  }
  t=_tk;
  /* RULE 190 — CHILLI POWDER IS RED, SO THE WORD `RED` IS NOT PART OF ITS IDENTITY.
     Jayant, 10-Sep: *"for Akhil Devesh Vidhatha HH we have two card for chilli powder fix it ,
     should be one"*. y42 held "Chilli Powder" 80 g and "Aashirvaad Chilli Powder" 193 g on ONE card
     and "Badshah Red Chilli Powder" 100 g on a SECOND. Asked directly which token split them:

         ppMPair(["chili","powder"], ["badshah","chili","powder"])     true
         ppMPair(["chili","powder"], ["red","chili","powder"])         FALSE

     — `red` is in PP_MODW, the words that MEAN something about the food, and for a fresh chilli it
     does: Rule 153 keeps green and red chillies apart because there the colour IS the food. A
     GROUND chilli is red by definition — all 44 chilli-powder rows on the live shelves are, and
     there is no green chilli powder anywhere in this ledger — so on a powder the word is packaging.

     WHY `red` AND NOT THE PAIR TEST ITSELF: ppMPair allows the shorter token list to be a SUFFIX of
     the longer one and then rejects the pair if any extra PREFIX word is in PP_MBLOCK — and `red`
     is in PP_MBLOCK, correctly, because a red onion is not an onion. Dropping the token here, for
     powders only, leaves that general meaning untouched.

     NARROW IN TWO WAYS. It fires only when the tokens hold BOTH `chili` and a ground form, so
     "Red Chilly Whole" (y42, 178 g) keeps its own card — whole is not powder, Rule 17c. And it
     drops only `red`, not every colour, so a green chilli powder would still be its own food if
     one ever arrived.

     MEASURED PAIR BY PAIR over all 4,538 live rows, this rule ALONE against the same file without
     it: 7 pairs newly merge, 0 newly split. Six are the fix — h9 21+39 g, y24 150+153 g, y27
     101+64 g, y28 953+14 g and 953+192 g, y42 80+193+100 g (his report). 10 of the 23 households
     holding chilli powder drew more than one card for it.

     TWO THINGS THE MEASUREMENT CORRECTED, and they are here because guessing them cost nothing only
     because I measured:
       * THE VARIETIES MERGE TOO — y24's Kashmiri and y28's Byadagi/Byadgi join the plain card,
         because `kashmiri` and `byadgi` are not in PP_MBLOCK. I had claimed they would stay apart.
         It matches what he asked for (one card for chilli powder) and it is what the vocabulary
         already believed: those words are read as brands, not as different chillies.
       * THE SEVENTH MERGE IS y40's "Idly Chilli powder" (12 g) joining its "Red chilli powder"
         (20 g), and idli podi is NOT chilli powder. Keeping it out needs `idli`/`idly` in
         PP_MBLOCK, and that was measured too: it costs THREE correct cards — y25's "Dosa Batter
         (Fermented)" 500 g splits from "iD Idli & Dosa Batter", and y28's "Idli Chutney Powder
         (homemade)" 440 g splits from both its "Chutney Powder (Podi)" jars. Three real cards for
         12 g is the wrong trade, so the row is left merged and NAMED in the report instead: if it
         is milagai podi, renaming the row says so and the vocabulary handles it cleanly. */
  var _hasChili=false,_hasGround=false,_hasRed=false;
  for(var _r=0;_r<t.length;_r++){
    if(t[_r]==='chili')_hasChili=true;
    if(t[_r]==='powder'||t[_r]==='ground')_hasGround=true;
    if(t[_r]==='red')_hasRed=true;
  }
  if(_hasChili&&_hasGround&&_hasRed){
    var _nr=[];
    for(var _s=0;_s<t.length;_s++)if(t[_s]!=='red')_nr.push(t[_s]);
    t=_nr;
  }
  /* REPEATED TOKENS COLLAPSE, and it has to come last: the synonym pass can produce the same token
     twice, e.g. "Coconut Chunks" plus a group whose canonical is also coconut. */
  var seen={},u=[];
  for(var q=0;q<t.length;q++){if(seen[t[q]])continue;seen[t[q]]=1;u.push(t[q]);}
  return u;}
function ppFoodSig(toks){var out=[],real=0;
  for(var i=0;i<toks.length;i++)if(PP_FOODW[toks[i]]){out.push(toks[i]);if(!PP_MODW[toks[i]])real++;}
  /* Nothing the Recipe Master recognises as food -> NO signature, so it pools with nothing. A blank
     signature must never be treated as a match; that would heap every unknown row into one card. */
  if(!out.length)return '';
  /* RULE 145 — and a signature of nothing but MODIFIERS is equally no signature: "Green Capsicum"
     and "Green Chillies" both reduce to "green" once the vocabulary fails to name their food, and
     ppMSameFood compares signatures exactly, so they merged into one card. */
  if(!real)return '';
  return out.sort().join(' ');}
function ppProdType(toks){var out=[];
  for(var i=0;i<toks.length;i++)if(PP_PRODTYPE[toks[i]])out.push(toks[i]);
  return out.sort().join(' ');}
function ppMSameFood(a,b){
  if(!a.length||!b.length)return false;
  if(ppProdType(a)!==ppProdType(b))return false;   /* a milk DRINK is not milk */
  var sa=ppFoodSig(a),sb=ppFoodSig(b);
  return !!sa&&sa===sb;}
function _ppPieceLook(name, tbl){
  var t=' '+String(name==null?'':name).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ')+' ';
  var sing=' '+t.trim().split(' ').map(function(w){
    if(w.length<4)return w;
    if(w.slice(-3)==='ies')return w.slice(0,-3)+'y';
    if(w.slice(-1)==='s'&&w.slice(-2)!=='ss')return w.slice(0,-1);
    return w;}).join(' ')+' ';
  var best=0,bl=0;
  for(var k in tbl){if(!tbl.hasOwnProperty(k))continue;
    if((t.indexOf(' '+k+' ')>=0||sing.indexOf(' '+k+' ')>=0)&&k.length>bl){bl=k.length;best=tbl[k];}}
  return best;}
function ppPieceGramsW(name){return _ppPieceLook(name, PP_PIECEG_W);}
function ppPieceWeight(name){
  /* A PLURAL MUST NOT COST A ROW ITS PIECE WEIGHT. Jayant, 3-Sep, on y33: the table already HELD
     'english cucumber' at 150 g, but this matched whole words on a padded string, so
     " english cucumbers " never contained " english cucumber " and the row was valued at ZERO.
     Measured: 50 rows across every household lost their piece weight to a plural — Oranges,
     Carrots, Lemons, Apples, Bananas, Guavas, Cheese Slices, Red Onions, Drumsticks. Rule 141's
     sub-scrap floor reads this table, so all 50 were judged with no piece weight at all.
     The singularisation lives in _ppPieceLook so this and ppPieceGramsW cannot drift apart. */
  return _ppPieceLook(name, PP_PIECEG);}
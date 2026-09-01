#!/usr/bin/env python3
"""PantryPulse Items Tracker generator — ERROR-PROOF, regenerable.
Usage: python3 make_tracker.py <MASTER.xlsx> <OUT.xlsx>
Reads EVERY row of every household tab from the master (single source of truth).
Nothing is hand-typed; out-of-stock items included so search always answers.
Regenerate after every EOD build — the sheet can never diverge from the model."""
import sys, re, datetime
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

TABS=[('Shunyam & Ishan','Shunyam & Ishan - latest'),('Soozy & Munz','Soozy & Munz'),
 ('Disha & Anirudh','Disha & Anirudh'),('Kartik & Dhara','Kartik & Dhara'),
 ('Rahul & Radhika','Rahul & Radhika'),('Paxal & Sana','Paxal & Sana'),('Pratik & Sakshi','Pratik & Sakshi'),('Yash & Manik','Yash & Manik'),('Padmaja & Rohan','Padmaja & Rohan')]

# Bidirectional alias map: if any KEY appears in the item name, ALL its aliases are added.
# Includes Hindi<->English + spelling variants (aata/atta, sooji/suji, dhania/dhaniya) + families.
A={
 # flours & grains (millet family cross-ref: every millet gets 'millet')
 'atta':'aata, flour, chakki, wheat','aata':'atta, flour','wheat flour':'atta, aata','khapli':'emmer wheat, khapli atta aata',
 'maida':'refined flour, all purpose','besan':'gram flour, chana flour, chickpea flour',
 'jowar':'sorghum, millet, jowar atta aata jwar','bajra':'pearl millet, millet, bajra atta aata bajri',
 'ragi':'finger millet, millet, nachni, ragi atta aata','foxtail millet':'millet, kangni','barnyard millet':'millet, samak, sanwa',
 'little millet':'millet, kutki, samai','kodo':'millet, kodra','amaranth':'rajgira, ramdana, millet-like grain',
 'barley':'jau, pearl barley','buckwheat':'kuttu','millet':'siridhanya, all millets: jowar bajra ragi foxtail barnyard little kodo',
 'sattu':'roasted gram flour','daliya':'dalia, broken wheat, porridge','suji':'sooji, rava, semolina','sooji':'suji, rava, semolina',
 'rava':'suji, sooji, semolina','semolina':'suji, sooji, rava','poha':'flattened rice, beaten rice, avalakki, chivda',
 'sabudana':'sago, tapioca','vermicelli':'seviyan, semiya','corn flour':'cornflour, makkai atta, corn starch',
 'corn starch':'cornflour, corn flour','cornflour':'corn flour, corn starch','oats':'oatmeal, rolled oats, jai',
 'quinoa':'keenwa','muesli':'granola, breakfast cereal','puttu podi':'rice flour (puttu)',
 'rice flour':'chawal ka atta aata','idli':'idli-dosa batter','dosa batter':'idli dosa batter',
 # rice
 'rice':'chawal','basmati':'long-grain rice, chawal','sona masoori':'sona masuri, sonamasuri rice chawal','matta':'kerala red rice',
 'black rice':'forbidden rice','brown rice':'unpolished rice',
 # dals & legumes
 'moong':'mung, green gram','green moong':'whole mung, sabut moong','moong dal':'yellow mung',
 'toor':'arhar, tur, pigeon pea dal','arhar':'toor, tur, pigeon pea dal','masoor':'red lentil, malka',
 'urad':'black gram, kali dal','chana dal':'split chickpea, bengal gram','kala chana':'black chana, desi chickpea',
 'kabuli':'chole, chickpeas, safed chana','rajma':'kidney beans, red beans','moth':'matki, moth beans',
 'vaal':'field beans dal','soya chunk':'soy nuggets, meal maker','soybean':'soya bean','panchmel':'mixed dal, panchratna',
 'black dal':'kali dal, urad','edamame':'green soybean','tempeh':'fermented soy, tempayy',
 # spices (Hindi-first coverage!)
 'jeera':'cumin, zeera','cumin':'jeera','haldi':'turmeric','turmeric':'haldi','dhaniya':'dhania, coriander','dhania':'dhaniya, coriander',
 'coriander powder':'dhania dhaniya powder','mirchi':'chilli','chilli powder':'lal mirch, mirchi powder',
 'kashmiri':'kashmiri lal mirch, mild red chilli','elaichi':'cardamom, green cardamom','cardamom':'elaichi',
 'dalchini':'cinnamon','cinnamon':'dalchini','laung':'clove','clove':'laung','ajwain':'carom seeds, ajowan, oma',
 'kalonji':'nigella, black seeds, onion seeds','methi':'fenugreek','fenugreek':'methi, kasuri','kasuri':'dried methi, fenugreek leaves',
 'hing':'asafoetida','saunf':'fennel','fennel':'saunf','amchur':'dry mango powder, amchoor','anardana':'dried pomegranate powder',
 'khus khus':'poppy seeds, posto','badiyan':'star anise, chakri phool','star anise':'badiyan','dagad phool':'stone flower, kalpasi',
 'tej patta':'bay leaf','bay leaf':'tej patta','pepper':'kali mirch, peppercorn','mustard seed':'rai, sarson',
 'red mustard':'rai, sarson','nutmeg':'jaiphal','jaljira':'jal jeera, cumin cooler','sumac':'middle-eastern souring spice',
 'zaatar':'zatar, middle-eastern herb mix','paprika':'mild red pepper powder','oregano':'pizza herb, ajwain-patta',
 'garam masala':'whole spice mix','masala':'spice mix / blend','khada masala':'whole spices, sabut masala',
 'sambar':'sambhar powder','sambhar':'sambar powder','rasam':'south spice soup powder','chaat masala':'tangy sprinkle masala',
 'pav bhaji':'mumbai bhaji masala','biryani masala':'biryani spice mix','chole masala':'chana masala mix',
 'kitchen king':'mixed veg masala','chutney powder':'chutney pudi, podi, gunpowder','puliogare':'tamarind rice powder',
 # sweeteners, condiments, sauces
 'sugar':'cheeni, shakkar, white label','jaggery':'gur, gud','honey':'shahad','jam':'fruit preserve','ketchup':'tomato sauce',
 'vinegar':'sirka','soy sauce':'soya sauce','soya sauce':'soy sauce','oyster sauce':'chinese sauce','fish sauce':'thai sauce',
 'sriracha':'hot chilli sauce','hoisin':'chinese bbq sauce','gochujang':'korean chilli paste','schezwan':'szechuan chutney',
 'harissa':'north african chilli paste','pickle':'achar, achaar','achar':'pickle','thecha':'maharashtrian chilli-garlic',
 'peri peri':'piri piri','sauce':'condiment','mayonnaise':'mayo','tahini':'sesame paste','pasta sauce':'red sauce',
 # oils & fats
 'ghee':'clarified butter, toop','oil':'tel','groundnut oil':'peanut oil, moongphali tel','mustard oil':'sarson ka tel',
 'coconut oil':'nariyal tel','olive oil':'jaitun','sunflower oil':'surajmukhi tel','sesame oil':'til oil, gingelly',
 'butter':'makkhan','cream':'malai','cheese':'paneer-family, cheddar/mozzarella/parmesan/feta/gruyere',
 'cheddar':'cheese','mozzarella':'cheese, pizza cheese','parmesan':'hard italian cheese','feta':'greek cheese','gruyere':'swiss cheese',
 'cream cheese':'soft cheese, philadelphia-style',
 # dairy
 'milk':'doodh','toned milk':'light milk doodh','skimmed':'fat-free milk','lactose':'lactose-free milk','oat milk':'plant milk',
 'almond milk':'plant milk, badam milk','condensed milk':'milkmaid, mithai milk','buttermilk':'chaas, chaach, mattha',
 'chaach':'buttermilk, chaas','curd':'dahi, yogurt','dahi':'curd, yogurt','yogurt':'curd, dahi','yoghurt':'curd, dahi',
 'greek yogurt':'hung curd-like, thick dahi','skyr':'icelandic yogurt, thick dahi','hung curd':'chakka, greek-style dahi',
 'paneer':'cottage cheese, chenna','tofu':'soy paneer','milkmaid':'condensed milk',
 # bread, noodles, pasta
 'bread':'pav, loaf, slice, double roti','pav':'ladi pav, bun, bread','sourdough':'artisan bread, khatta bread',
 'noodle':'noodles, chowmein','hakka':'chinese noodles','soba':'buckwheat noodles','shirataki':'konjac zero-carb noodles',
 'udon':'thick japanese noodles','pasta':'penne fusilli farfalle spaghetti macaroni','spaghetti':'pasta','penne':'pasta',
 'farfalle':'bow-tie pasta','fusilli':'spiral pasta','tagliatelle':'ribbon pasta','vermicelli upma':'semiya',
 # nuts, seeds, dry fruits
 'almond':'badam','cashew':'kaju','raisin':'kishmish','pista':'pistachio','walnut':'akhrot','peanut':'moongphali, groundnut, sing',
 'makhana':'fox nuts, phool makhana, lotus seeds','chia':'chia seeds','flax':'alsi, linseed','pumpkin seed':'seeds mix',
 'sunflower seed':'seeds mix','watermelon seed':'magaz','sesame':'til','mixed seeds':'seeds mix','trail mix':'dry fruit mix',
 # veg & fruit (major)
 'potato':'aloo, batata','onion':'pyaaz, kanda','tomato':'tamatar','garlic':'lehsun, lasun','ginger':'adrak',
 'green chilli':'hari mirch','spinach':'palak','palak':'spinach','methi leaves':'fenugreek leaves','bathua':'chenopodium saag',
 'okra':'bhindi, ladys finger','bhindi':'okra, ladys finger','bottle gourd':'lauki, doodhi, ghiya','brinjal':'baingan, eggplant',
 'capsicum':'bell pepper, shimla mirch','cabbage':'patta gobhi','cauliflower':'phool gobhi','peas':'matar',
 'sweet corn':'makkai, corn kernels, bhutta','baby corn':'babycorn','beetroot':'chukandar','carrot':'gajar',
 'cucumber':'kheera, kakdi','radish':'mooli','pumpkin':'kaddu','zucchini':'courgette','curry leaves':'kadi patta, kadhi patta',
 'coriander':'dhania, hara dhania, cilantro','mint':'pudina','pudina':'mint','lemon':'nimbu, lime','banana':'kela',
 'apple':'seb','mango':'aam','papaya':'papita','watermelon':'tarbooz','muskmelon':'kharbooja','pomegranate':'anaar',
 'grapes':'angoor','kiwi':'kiwifruit','avocado':'butter fruit','sprouts':'ankurit, moong sprouts',
 # protein
 'egg':'anda, ande','chicken':'murgh, murgi','prawn':'shrimp, jhinga','fish':'machli','keema':'mince, kheema',
 'protein powder':'whey, supplement','whey':'protein powder','creatine':'workout supplement','isabgol':'psyllium husk',
 'psyllium':'isabgol, husk','tea':'chai, chaha','coffee':'kaapi','kokum':'garcinia, sol','tamarind':'imli',
 'papad':'papadum, appalam','soan':'soan papdi','custard':'custard powder','cocoa':'chocolate powder','baking powder':'raising agent',
}
def aliases(name):
    nl=name.lower(); hits=[]
    for k,v in A.items():
        if k in nl: hits.append(v)
    return ('; '.join(dict.fromkeys(hits)))[:160]

def main(src_path,out_path):
    src=load_workbook(src_path)
    # read build tag from Index if present
    tag=''
    try:
        idx=src['Index']
        for r in range(1,min(idx.max_row,30)+1):
            for c in range(1,6):
                v=str(idx.cell(r,c).value or '')
                if 'MASTER_' in v: tag=v; break
    except Exception: pass
    HDR=Font(bold=True,color='FFFFFF',size=10); HF=PatternFill('solid',fgColor='0F3D2E')
    G=PatternFill('solid',fgColor='E7F4EC'); R=PatternFill('solid',fgColor='FBEAEA'); Y=PatternFill('solid',fgColor='FFF6DD')
    thin=Border(bottom=Side(style='thin',color='DDDDDD'))
    COLS=['Household','Category','Item','Also known as / search words','Available?','Quantity','Unit','Last checked','Last updated','Expiry','Note']
    WID=[16,14,32,34,11,10,9,12,12,10,42]
    out=Workbook(); out.remove(out.active)
    def sheet(ws,rows):
        for c,(h,wd) in enumerate(zip(COLS,WID),1):
            cell=ws.cell(1,c,h); cell.font=HDR; cell.fill=HF
            ws.column_dimensions[get_column_letter(c)].width=wd
        ws.freeze_panes='A2'; ws.auto_filter.ref=f'A1:K{len(rows)+1}'
        for i,rw in enumerate(rows,2):
            for c,v in enumerate(rw,1):
                cell=ws.cell(i,c,v); cell.border=thin
                cell.alignment=Alignment(vertical='top',wrap_text=(c in (4,11)))
            f=G if rw[4]=='YES' else (R if rw[4]=='NO' else Y)
            for c in range(1,12): ws.cell(i,c).fill=f
    allrows=[]
    for disp,tab in TABS:
        w=src[tab]; rows=[]
        for r in range(5,w.max_row+1):
            n=w.cell(r,2).value
            if not n: continue
            q=w.cell(r,3).value; qn=q if isinstance(q,(int,float)) else 0
            st=str(w.cell(r,5).value or '').lower()
            avail='YES' if (qn and qn>0 and st!='out') else 'NO'
            if str(w.cell(r,7).value or '')=='expired': avail='EXPIRED'
            rows.append([disp,str(w.cell(r,1).value or ''),str(n),aliases(str(n)),avail,
                round(qn,1),str(w.cell(r,4).value or ''),str(w.cell(r,9).value or ''),
                str(w.cell(r,10).value or ''),str(w.cell(r,12).value or ''),str(w.cell(r,11).value or '')[:140]])
        allrows+=rows
        sheet(out.create_sheet(disp[:28]),sorted(rows,key=lambda x:(x[1],x[2].lower())))
    sheet(out.create_sheet('ALL ITEMS — SEARCH HERE',0),sorted(allrows,key=lambda x:(x[2].lower(),x[0])))
    rd=out.create_sheet('READ ME',1); rd.column_dimensions['A'].width=112
    gen=datetime.datetime.now().strftime('%d %b %Y %H:%M')
    for i,t in enumerate([
     f"PANTRYPULSE ITEMS TRACKER — generated {gen} from {src_path.split('/')[-1]} {('['+tag+']') if tag else ''}",
     "","REGENERATED AUTOMATICALLY from the master workbook on every EOD build — this sheet can never diverge",
     "from the model: every row of every household tab is re-read in full each time (out-of-stock items included,",
     "so a search always answers YES / NO / EXPIRED — never 'not tracked').","",
     "HOW TO SEARCH: 'ALL ITEMS — SEARCH HERE' tab, Ctrl+F / Cmd+F. Hindi or English, any common spelling:",
     "  'jowar aata' -> Organic jowar flour   |   'millet' -> ALL millets (jowar/bajra/ragi/foxtail/barnyard/little)",
     "  'dahi' -> curd/yogurt rows   |   'kaju' -> cashew   |   'ajwain' -> carom   |   'isabgol' -> psyllium husk",
     "","COLUMNS: Available? YES(green)/NO(red)/EXPIRED(yellow) | Quantity+Unit = left as per model |",
     "Last checked = last physically verified | Last updated = last quantity change | Note = how figure was derived.",
    ],1):
        c=rd.cell(i,1,t)
        if i==1: c.font=Font(bold=True,size=12,color='0F3D2E')
    out.save(out_path)
    print(f'tracker written: {out_path} ({len(allrows)} rows) from {src_path} {tag}')

if __name__=='__main__':
    main(sys.argv[1],sys.argv[2])

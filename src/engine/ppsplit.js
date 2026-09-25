/* ================================================================================================
   PLANNER TEXT -> COMPONENTS, in the browser.
   This is the ONLY logic that exists in both Python and JavaScript. Everything else the button
   needs (the quantities) arrives as PP_NEEDS, a table computed by the one real engine.
   The regexes are not hand-typed: they are exported from dishkey.py at bake time into PP_SC, so
   they cannot drift from the Python source. Equivalence is proven at bake time over every planner
   string and every ledger dish string; the bake fails on a single disagreement.
   ================================================================================================ */
function ppRx(p, f){ return new RegExp(p, f||''); }
function ppEsc(w){ return String(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

function ppSpellFix(t){
  t = String(t||'');
  /* PROTECT runs FIRST and welds compounds together — "mac and cheese" must survive the " and "
     split as one dish. Missing it, the browser served "mac" and "cheese broccoli" as two dishes. */
  var P=PP_SC.PROTECT||[];
  for (var j=0;j<P.length;j++) t = t.replace(ppRx(P[j][0],'gi'), P[j][1]);
  for (var i=0;i<PP_SC.SPELL.length;i++) t = t.replace(ppRx(PP_SC.SPELL[i][0],'gi'), PP_SC.SPELL[i][1]);
  return t;
}
function ppNamedVegOnly(core){
  /* "names nothing but a vegetable" — the test that decides whether a fragment is a dish or an
     ingredient of the dish before it. Uses the same VEGLEX keywords as Python. */
  var found=false;
  for (var i=0;i<PP_SC.VEGWORDS.length;i++){
    /* VEGLEX keywords contain regex metacharacters — "beans (fresh" blew up RegExp. Escape them;
       Python matched them literally via re.escape in the caller. */
    var w=PP_SC.VEGWORDS[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if (ppRx('(?<![a-z])'+w+'(e?s)?(?![a-z])','i').test(core)) { found=true; break; }
  }
  return found;
}
function ppHasFamily(c){ return Object.prototype.hasOwnProperty.call(PP_NEEDS, c); }
/* Python's family_of() finds a family by name or by style word, so a component can have a recipe
   family without being a table key. Using table membership as the family test made the browser
   treat "tomato-beetroot soup" as a loose vegetable. */
function ppFamilyOf(c){
  /* The NAME of the matched family, not just whether one exists — Python's _bare() asks whether the
     FAMILY is ingredient-only, so it needs the name, not a boolean.
     THE NAME MUST COME FROM THE SAME LOOKUP PYTHON USES. This used to run its own scan: a
     word-anchored /(?<![a-z])fam(e?s)?(?![a-z])/ over PP_SC.FAMS and then, separately, over
     PP_SC.STYLE — 26 of whose words are not in the ORDER list family_of actually searches. Two
     defects, one cause. family_of matches a family as a plain SUBSTRING (`k in c`), so
     family_of('strawberries') is 'berries' and family_of('pineapple') is 'apple'; the anchor made
     both null here, _bare() called each fragment a nameless ingredient and folded it backwards.
     y29's 18-Aug breakfast became "pistachios strawberries" — a component no sheet row prices,
     which fuzzy-matches a strawberry dessert — while Python kept two priced dishes. Same shape as
     the ppHasFamilyLike bug above: a lookalike lookup instead of the ported one.
     ppFamilyOfExact IS the port of family_of (substring over PP_SC.ORDER, Rule 50b style tiebreak),
     so delegate and there is nothing left to drift. Do NOT reintroduce a private scan here. */
  return ppFamilyOfExact(String(c||'').toLowerCase());
}
function ppHasFamilyLike(c){
  /* THE MERGE TEST MUST BE THE ENGINE'S OWN FAMILY TEST, NOT A LOOKALIKE.
     Python's _merge_ingredient_fragments folds a fragment back into the previous dish when
     `not family_of(core)`. This function used to answer a DIFFERENT question — it scanned
     PP_SC.STYLE and PP_SC.FAMS separately — and 20 of the 49 STYLE words are not in the ORDER list
     family_of actually searches (masala, curry, gravy, fry, roast, sabji, jalfrezi, kadai...). So
     for "Dosa, aloo masala, coconut chutney" Python folded "aloo masala" into the dosa and resolved
     it, while the browser saw the style word "masala", kept the fragment standing alone, found no
     recipe for it and refused the whole household. One wrong lookup, twenty latent divergences.
     ppFamilyOfExact IS the port of family_of, so delegate and there is nothing left to drift. */
  return ppFamilyOfExact(String(c||'').toLowerCase()) !== null;
}

/* RULE 86 — the trailing "(Name)" a person prefix leaves behind. Twin of dishkey._whotag. */
function ppWhoTag(s){
  var m=/\(([^)]*)\)\s*$/.exec(String(s||''));
  if (m && ppRx(PP_SC.NAMES,'i').test(m[1]) && !ppRx(PP_SC.ALLWORD,'i').test(m[1]))
    return m[1].replace(/\s+/g,' ').trim().toLowerCase();
  return '';
}

function ppMergeFragments(parts){
  var out=[];
  for (var i=0;i<parts.length;i++){
    var p=parts[i];
    var core=p.replace(/\s*\([^)]*\)/g,'').trim().toLowerCase();
    /* THE MERGE TEST MUST ASK ABOUT THE SPELLING ppFamilyOfExact ACTUALLY INDEXES. Twin of the
       same change in dishkey._merge_ingredient_fragments, made in lockstep or Rule 66 reports the
       divergence. "palak daal" has no family while "palak dal" does, so one alternate spelling made
       y32's dal look like a bare run of vegetables and it folded backwards into the jeera rice
       beside it. The EMITTED text stays `p`, unfixed — this only decides where the boundary is. */
    core = ppSpellFix(core).trim().toLowerCase();
    var bareVeg = ppNamedVegOnly(core) && !ppHasFamilyLike(core) && core.split(/\s+/).length<=2;
    /* RULE 86 — a fragment may only fold into something the SAME PERSON is eating. Siddharth's
       tomato folding backwards into the household's roti produced the dish "roti tomato onion". */
    if (bareVeg && out.length && ppWhoTag(p) === ppWhoTag(out[out.length-1]))
      out[out.length-1] = out[out.length-1]+' '+p;
    else out.push(p);
  }
  return out;
}

function ppPlannerToDish(txt){
  var t=String(txt||'');
  t = t.replace(ppRx(PP_SC.KCAL,'gi'),' ');
  /* RULE 85 — "Chapati: 3" is a dish with a count, not a person called Chapati. Must run BEFORE
     WHOFOR, exactly as in dishkey.planner_to_dish, or WHOFOR eats the colon and the number is left
     alone below the 2-character floor and dropped. Groups: 1 = bullet/indent, 2 = the food,
     3 = the count. */
  if (PP_SC.COUNTCOLON)
    t = t.replace(ppRx(PP_SC.COUNTCOLON,'gim'), function(_,g1,g2,g3){
      return g1 + g3 + ' ' + String(g2).replace(/^\s+|\s+$/g,''); });
  t = t.replace(/&/g,' and ');
  t = t.replace(/[ \t]+/g,' ');
  for (var k in PP_SC.KEEP) t = t.replace(ppRx(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), PP_SC.KEEP[k]);
  /* RULE 217 — the planner's OWN dish names, protected from the ' and ' split. Twin of the ATOMS
     loop in dishkey.planner_to_dish, and placed here for the same reason: this is the function that
     turns ' and ' into a separator, so "Tofu and Sweet potato paratha" is already two dishes by the
     time ppComponents2 runs. Deliberately NOT restored with the KEEP markers in the per-part loop
     below — the marker has to survive into ppComponents2, which restores it as it emits. */
  for (var ka in (PP_SC.ATOMS||{})) t = t.replace(ppRx(ka.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), PP_SC.ATOMS[ka]);
  /* RULE 211 — a FOOD before the colon is a dish heading, not a person ("Salad: Onion, tomato &
     cucumber"). Gated on the family lexicon exactly as Rule 71 gates WHOFOR_DASH on NAMES; twin of
     dishkey.planner_to_dish, made in lockstep because Rule 66 fails the bake when these disagree.
     ppFamilyOfExact IS the port of family_of, so there is nothing here that can drift. */
  t = t.replace(ppRx(PP_SC.WHOFOR,'g'), function(whole,g1){
    return ppFamilyOfExact(String(g1).trim().toLowerCase()) ? whole
                                                           : ('\n@@'+String(g1).trim()+'@@'); });
  /* RULE 71 — the planner also writes "Manish - Avocado toast". Gated on the NAMES lexicon so a
     dish like "Chilli - rotis" is not read as a person. Ported from dishkey.WHOFOR_DASH; both
     patterns are exported, never retyped (Rule 67). */
  t = t.replace(ppRx(PP_SC.WHOFOR_DASH,'g'), function(whole,g1){
    return ppRx(PP_SC.NAMES_PAT,'i').test(g1) ? ('\n@@'+String(g1).trim()+'@@') : whole; });
  t = t.replace(ppRx(PP_SC.INSTR,'gi'),' ');
  /* RULE 86b — A PLANNER LINE BREAK IS A DISH BOUNDARY, AND A STRONGER ONE THAN THE PERSON TAG.
     `out` holds ONE ARRAY PER LINE, so ppMergeFragments never sees two lines at once and a fragment
     cannot fold across a line break. Twin of dishkey.planner_to_dish — the same change, made in
     lockstep, because Rule 66 fails the bake when these two disagree.
     Flat accumulation produced "gobi paratha spinach" (y14, the paratha took the sandwich's spinach
     as its filling) and "carrots bell peppers spring onion yellow curry" (y24, two people's dinners
     welded together and then fuzzy-matched to a tamarind curry). */
  /* RULE 86c — a line ending in a bare preparation adjective is a WRAPPED line, not a dish boundary.
     y24's "Tempeh Bhurji + Sauteed \nVeggies (Carrot, Beans)" is one dish typed across two lines;
     Rule 86b split it and the orphan "sauteed" drew a whole generic mixed-veg family from the library
     ALONGSIDE the "mixed veggies" beside it — the same six vegetables deducted twice. Applied here,
     immediately before the split and AFTER WHOFOR has rewritten person prefixes to "@@Name@@", so the
     lookahead cannot swallow the next person's line. Pattern exported from dishkey.WRAPJOIN, never
     retyped (Rule 67); the capture group is re-emitted by this call site exactly as WHOFOR's is
     above, so no backreference reaches String.replace. Rule 66e proves the two engines agree. */
  t = t.replace(ppRx(PP_SC.WRAPJOIN,'gi'), function(_,g1){ return ' '+g1+' '; });
  var out=[], lines=t.split('\n');
  for (var li=0; li<lines.length; li++){
    var line=lines[li].trim().replace(ppRx(PP_SC.MEALLBL,'i'),'');
    if(!line) continue;
    /* RULE 201 — A PREP LINE IS A PREP LINE ALL THE WAY TO ITS END, INCLUDING PAST AN "&".
       Asked HERE, while the line is still whole, because ARTEFACT is tested per FRAGMENT and the
       splitter breaks on "&" / " and " / "+" — so only the fragment holding the verb was dropped and
       every food after the conjunction was orphaned into a dish ("Soak Urad Dal & Barnyard Millet"
       -> 'barnyard millet'; "soak urad dal and rajma" -> 'rajma', which prices 100 g of rajma plus
       onion, ginger and garlic against a household told only to soak). Anchored at line start: a
       line BEGINNING with these verbs is wholly an instruction and no dish name begins with them.
       Identical pattern at the identical point in dishkey.planner_to_dish; Rule 66e fails the bake
       if the two engines disagree. */
    if(ppRx(PP_SC.PREPLINE,'i').test(line)) continue;
    /* RULE 202 — a bare meal-slot heading is not a dish (dishkey.SLOTLINE, same call site). */
    if(ppRx(PP_SC.SLOTLINE,'i').test(line)) continue;
    var lineparts=[];                 /* parts of THIS line only — see RULE 86b */
    var who=null, m=/^@@([^@]+)@@\s*(.*)$/.exec(line);
    if(m){ who=m[1]; line=m[2]; }
    /* RULE 109f — SPLIT ONLY OUTSIDE BRACKETS, HERE TOO. Mirrors dishkey._split_outside_brackets.
       Splitting on ' and ' tore "(for Yash and Siddharth)" in half, so no complete "(Name)" was
       left for anything downstream to find. Rule 81 fixed this in the component splitter and not
       in this one; a fix in one twin and not the other is a second home for the same bug. */
    var parts=ppSplitLineOutsideBrackets(line);
    for (var pi=0; pi<parts.length; pi++){
      var part=parts[pi].replace(/^[\s.+]+|[\s.+]+$/g,'');
      for (var kk in PP_SC.KEEP) part = part.split(PP_SC.KEEP[kk]).join(kk);
      part = part.replace(/^\s*with\s+/i,'');
      if (part.length<2) continue;
      if (ppRx(PP_SC.ARTEFACT,'i').test(part) || ppRx(PP_SC.NOISE,'i').test(part)) continue;
      var w=who;
      if(!w){
        /* RULE 109d — the name need not be at the END. h9's dinner is
           "Paneer bhurji (for Yash and Siddharth) + 2 chapati each", where the bracket sits in the
           middle, so an end-anchored search found nothing and the chapatis lost their owner. */
        var m2=null, all=/\(([^)]*)\)/g, mc;
        while((mc=all.exec(part))!==null){
          if(ppRx(PP_SC.NAMES,'i').test(mc[1]) && !ppRx(PP_SC.ALLWORD,'i').test(mc[1])){ m2=mc; break; }
        }
        if(m2){
          w = m2[1].replace(/\bonly\b|\bfor\b/gi,'').replace(/^[\s,;]+|[\s,;]+$/g,'').trim();
          part = (part.slice(0,m2.index)+' '+part.slice(m2.index+m2[0].length)).trim();
          /* A PERSON NAMED ANYWHERE ON THE LINE OWNS THE REST OF THE LINE, so the tag must
             PERSIST into the parts that follow. dishkey.planner_to_dish declares `who` outside
             its `for part` loop and assigns to it here, which is exactly that scope; this side
             kept the discovery in the per-part local `w` and never wrote it back, so only the
             part carrying the bracket was ever tagged.
             y14's dinner "... + 2 Ragi roti (Pavitra) + 3 roti + cut onions and cucumber" splits
             on the final " and ", so `cucumber` arrived with who='' while `rotis onions` carried
             (Pavitra). Rule 86d then did its job and refused to fold an unowned fragment into
             someone's dish — leaving `cucumber` a dish of its own, four components on this side
             against Python's three. Rule 66e reported it as 1 latent split divergence the day the
             seeded soak sample first reached this menu; nothing in either splitter had changed.
             Write-back, in lockstep with the Python — Rule 66 fails the bake if they disagree. */
          who = w;
        }
      }
      if(w){
        var subs=part.split(/\s*\+\s*/).map(function(x){return x.trim();}).filter(Boolean);
        var whoc=w.replace(/\s+/g,' ').replace(/\s*(?:&|\band\b)\s*/g,', ').trim();
        /* RULE 109 — a bracket is not a person. "(4 eggs)" made y26's protein yogurt look
           already-tagged, so it kept no owner and was billed to three residents instead of two. */
        subs = subs.map(function(x){ return ppWhoTag2(x) ? x : x+' ('+whoc+')'; });
        /* ...and the tag must reach the HEAD of a "with" phrase, or components() later hands the
           vegetables an owner and leaves the dish itself ownerless. */
        subs = subs.map(function(x){
          if(!/\s+with\s+/i.test(x)) return x;
          if(ppWhoTag2(x.split(/\s+with\s+/i)[0])) return x;
          return x.replace(/^(.*?)(\s+with\s+)/i, function(_,h,w2){ return h+' ('+whoc+')'+w2; });
        });
        part = subs.join(' + ');
      }
      lineparts.push(part);
    }
    if(lineparts.length) out.push(lineparts);
  }
  var merged=[];
  for (var oi=0; oi<out.length; oi++) merged = merged.concat(ppMergeFragments(out[oi]));
  return merged.join('; ');
}

/* ---- component splitter (mirrors dishkey.components / components_meta) ---- */
/* the real synonym map, exported from dishkey.SYN — a hand-typed subset silently diverged */
/* RULE 123b (browser half) — A PARENTHETICAL OF FOODS IS INGREDIENTS, NOT A NOTE.
   I fixed this in dishkey.py first and the browser-parity soak went red within a minute: 3 WRONG and
   5 LATENT split divergences, because the JS splitter kept deleting "(carrot, cucumber)" while Python
   had started keeping it. Rule 66 exists for exactly this — a splitter that lives in two languages must
   change in both. The food vocabulary is PP_SHEET_UOM, the same 474 ingredients the rest of the app
   uses, so the two halves cannot drift on WHAT a food is either. */
function ppFoodParen(inner){
  /* 16-Sep — MIRROR of dishkey._keep_food_paren: a LEADING '+' inside the bracket means "and also",
     not "made of", so the fragment is handed to the ordinary '+' splitter instead of being merged
     inline. y31's "Masala Poha (+ Grated Tofu)" merged to "masala poha grated tofu", resolved to the
     tofu family and priced nothing (Rule 37). A genuine ingredient list has no LEADING '+' and is
     untouched. Python is the reference side; Rule 66e refuses the bake on any divergence. */
  var _add = /^\s*\+/.test(String(inner));
  if (_add) inner = String(inner).replace(/^\s*\+/, '');
  var toks = String(inner).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
  var skip = {and:1, or:1, with:1, plus:1, the:1, a:1};
  var meaningful = toks.filter(function(w){ return !skip[w]; });
  if (!meaningful.length) return ' ';
  /* THE WORD-LEVEL VOCABULARY, not the food-NAME one. Python's _keep_food_paren tests each token
     against recipe_sheet.foodwords; this side used to test against PP_SHEET_UOM, which is keyed by
     whole names. "Sauteed Vegetable (broccoli, baby corn, carrot, corn)" therefore failed on the
     lone token "baby" — a foodword, but never a food name — and the parenthetical was dropped, so
     the browser cooked a generic veg basket (mushroom, bell pepper, green beans, butter) where
     Python cooked the four vegetables the menu actually named. PP_SHEET_UOM is kept as a fallback
     for a build that predates PP_FOODWORDS, which is the old behaviour rather than a crash. */
  var VOC = (typeof PP_FOODWORDS !== 'undefined') ? PP_FOODWORDS
          : ((typeof PP_SC !== 'undefined' && PP_SC.FOODWORDS)
              ? PP_SC.FOODWORDS
              : ((typeof PP_SHEET_UOM !== 'undefined') ? PP_SHEET_UOM
                  : ((typeof PP_SC !== 'undefined' && PP_SC.SHEET_UOM) ? PP_SC.SHEET_UOM : null)));
  if (!VOC) return ' ';
  var inVoc = Array.isArray(VOC)
    ? function(w){ return VOC.indexOf(w) >= 0; }
    : function(w){ return !!VOC[w]; };
  /* 16-Sep — A PROCESS IS NOT A FOOD. MIRROR of dishkey._keep_food_paren's _naf filter.
     Jayant: "grated is a foodword (from \"Grated Coconut\"), no its process". PP_FOODWORDS comes
     from ingredient LABELS, so preparations ('grated', 'roasted', 'boiled', 'sauteed') sit in it
     and satisfied the all-foodwords test on their own: "Tofu (Grated)" kept its bracket and merged
     to `tofu grated`, which prices nothing (Rule 37). A bracket of preparations QUALIFIES the food
     before it and never adds one, so it is dropped like any other note. Ignored, not
     disqualifying — otherwise "(with spring onion, capsicum & carrot)" loses three vegetables to
     the lone _FRAGMENTS token 'spring' again. Python is the reference side; Rule 66e refuses the
     bake on any divergence. Absent NOTFOOD (a build predating this export) the filter is empty,
     which is exactly the old behaviour rather than a crash. */
  var NF = (typeof PP_NOTFOOD !== 'undefined') ? PP_NOTFOOD
         : ((typeof PP_SC !== 'undefined' && PP_SC.NOTFOOD) ? PP_SC.NOTFOOD : null);
  var isNF = !NF ? function(){ return false; }
           : (Array.isArray(NF) ? function(w){ return NF.indexOf(w) >= 0; }
                                : function(w){ return !!NF[w]; });
  /* NO SINGULAR FALLBACK, because Python's _keep_food_paren has none and this side is the one
     under test (gate_equiv: "expectations come from the Python engine, which is the reference").
     This tried `w` and then `w` minus a trailing 's', and Rule 66e refused the 28-Aug bake on the
     resulting latent split divergence -- on a LIVE line, not a sampled one: y32's 29-Aug lunch
     "Vegetable stew (carrot, beans, potato)". The sheet knows 'bean', not 'beans'. Python
     therefore dropped the parenthetical and the component "vegetable stew" hit the sheet's EXACT
     "Vegetable Stew" card -- potato, carrot, green beans, green peas, coconut milk, whole spices,
     coconut oil -- which already contains all three vegetables the parenthetical names. This side
     kept it, and "vegetable stew carrot beans potato" matched no card, fell through to the nearest
     one, and landed on "Aloo Beans": a dry potato-and-beans sabzi that buys NO CARROT and would
     have failed Rule 112e. So the reference is also the better answer here, and the fallback goes
     rather than teaching Python to keep the parenthetical.
     The deeper issue is left alone deliberately: GENERIC_HEAD matches the bare word "vegetable",
     so a real dish like "Vegetable stew" is treated as a generic placeholder in the first place.
     Narrowing that regex changes component names for every parenthetical dish in both engines and
     wants its own change with the soak re-run, not a patch inside a daily run. A proper shared
     singulariser is welcome too -- in BOTH engines at once. */
  var foodish = meaningful.filter(function(w){ return !isNF(w); });
  if (!foodish.length) return ' ';   /* only preparations: a qualifier, not an ingredient list */
  for (var i=0;i<foodish.length;i++){
    if (!inVoc(foodish[i])) return ' ';   /* one stray word: still a note */
  }
  /* the JOIN is over `meaningful`, not `foodish` — exactly as Python does — so a kept bracket
     still carries its preparation words into the component name and the two engines agree. */
  return (_add ? ' + ' : ' ') + meaningful.join(' ') + ' ';
}
function ppComponents2(part){
  var s=ppSpellFix(part);
  s=s.replace(ppRx(PP_SC.SLOT,''),'').replace(ppRx(PP_SC.TAGS,'gi'),' ');
  /* 3-Sep: THE GENERIC-HEAD TEST IS GONE FROM BOTH ENGINES, TOGETHER. It used to read
     `if (!/(veggie|veg\b|vegetable|mixed veg|sticks|salad veg|assorted|juice|smoothie)/i.test(head))
     return ' ';` — the mirror of dishkey.GENERIC_HEAD — and an earlier attempt to drop it on THIS
     side alone pushed the soak past its refusal ceiling, which is why the comment here used to warn
     against it. Dropping it in Python alone is just as wrong and is what Rule 66 caught this
     afternoon: 9 WRONG and 13 LATENT divergences within one bake, every one of them Python keeping
     a food parenthetical the browser still threw away.
     Both halves now keep a parenthetical whose every meaningful token is a food, whatever the head.
     The all-foodwords test in ppFoodParen is the strict part and is unchanged, so "(Astha)",
     "(Karthik, Gauri)", "(2 eggs)" and "(before breakfast)" are still dropped as notes. Measured
     over the 717 live menu texts before the change: 13 parentheticals newly kept, every one a
     genuine ingredient list, and ZERO components newly without a recipe. If you touch one engine,
     touch the other — that is the whole reason this rule exists. */
  s=s.replace(/\(([^)]*)\)/g, function(m, inner, off, whole){
    return ppFoodParen(inner);
  });
  /* a trailing "— 1" / "- 2" is a note, not part of the dish name. Python strips it here and the
     browser did not, so "amla juice - 1" became the component "amla juice 1" and matched nothing. */
  s=s.replace(ppRx(PP_SC.NOTE,''),'');
  s=s.split(ppRx('\\bper (plan|planner)\\b','i'))[0];
  var out=[], sub=s.split(/[;+\n\/]|(?<!\w)&(?!\w)|\bwith\b|\bplus\b|\band\b/i);
  for(var i=0;i<sub.length;i++){
    var p=sub[i].replace(ppRx(PP_SC.NAMES,'gi'),' ');
    /* RULE 185 — ask ARTEFACT BEFORE PREP strips the word that identifies a note. ARTEFACT carries
       \bsoak\b so a soak instruction is not read as a dish, and the test at the bottom of this loop
       never saw it because PREP had already removed 'soak', leaving the FOOD as a component:
       "Soak Chana" became 'chana' and was charged 100 g of kabuli chana. ppPlannerToDish above has
       always tested ARTEFACT on the raw fragment; this loop was the odd one out. dishkey.py's
       components() is changed identically — if you touch one engine, touch the other. */
    if(ppRx(PP_SC.ARTEFACT,'i').test(p)) continue;
    p=p.replace(ppRx(PP_SC.PREP,'gi'),' ').replace(ppRx(PP_SC.NOISE,'gi'),' ');
    p=p.replace(/[^\w\/&' ]/g,' ').replace(/\s+/g,' ').replace(/^[\s\/&]+|[\s\/&]+$/g,'').toLowerCase();
    p=p.replace(/^\d+\s*/,'');
    /* RULE 68 — peel measure/qualifier words, same loop Python runs */
    for(var t=0;t<4;t++){
      var q=p.replace(ppRx(PP_SC.QUALIFIER,'i'),'').replace(/^\s+|\s+$/g,'').replace(/^\d+\s*/,'');
      if(q===p || q.length<3) break;
      p=q;
    }
    /* RULE 190 — a TRAILING bare count blocks the SYN lookup ("Roti 2 each" -> 'roti 2'), where the
       leading form ("2 roti each") is already stripped above and reaches 'rotis'. Retry the lookup
       without the trailing digits rather than stripping them unconditionally: over all 2,427 planner
       texts the unconditional strip renames 30 components and changes ONE family, the retry moves
       exactly the one. Mirrors dishkey.components() — Rule 66e/66h refuses the bake if they differ.
       RULE 208 — the same count written as a MULTIPLIER ("Roti (6) x6" -> 'roti x6'). Measured over
       all 164 planner files the retry moves exactly one component, 'roti x6' -> 'rotis'; 'boiled
       eggs x8' and y40's three "(Carry over) x0" components are not SYN keys and keep their names. */
    if(PP_SC.SYN && PP_SC.SYN[p]) p=PP_SC.SYN[p];
    else { var _q=p.replace(/\s+x?\s*\d+$/,''); if(PP_SC.SYN && PP_SC.SYN[_q]) p=PP_SC.SYN[_q]; }
    for (var kb in (PP_SC.ATOMS||{}))            /* RULE 217 — restore, mirrors _ATOMBACK */
      if(p.indexOf(PP_SC.ATOMS[kb])>=0) p = p.split(PP_SC.ATOMS[kb]).join(kb);
    if(p.length<3) continue;
    if(/^[\d\s]*$/.test(p)) continue;
    if(ppRx(PP_SC.ARTEFACT,'i').test(p)) continue;
    out.push(p);
  }
  return out;
}
function ppNamedCount2(text){
  var m=String(text).match(/\(([^)]*)\)/g), seg=m?m.join(' '):String(text);
  /* RULE 109c — count the people whichever separator survived our own normalisation:
     planner_to_dish rewrites "(for Yash and Siddharth)" as "(for Yash; Siddharth)". */
  seg=seg.replace(/\bonly\b|\bfor\b/gi,' ');
  var ps=seg.split(/\s*(?:&|,|;|\/|\+|\band\b)\s*/).filter(function(p){return p.trim();});
  var n=0; for(var i=0;i<ps.length;i++) if(ppRx(PP_SC.NAMES,'i').test(ps[i])) n++;
  return Math.max(1,n);
}
/* RULE 81 — SPLIT ONLY OUTSIDE BRACKETS. Byte-for-byte the same rule as dishkey._split_top_level;
   the two are proven equivalent by gate_equiv (Rule 66), which is what caught the Python-only
   version of this change. Splitting the raw text on ; + / & before the parentheticals are dropped
   tears a note in half, unbalances its brackets, and the note then leaks out as FOOD —
   "(Shraavan: no onion/garlic)" produced a component called 'garlic', inverting the exclusion. */
var PP_SPLIT_RE=/[;+\n\/]|(?<!\w)&(?!\w)|\bwith\b|\bplus\b|\band\b/i;
function ppSplitTopLevel(raw){
  var parts=[], depth=0, buf='', i=0;
  while(i<raw.length){
    var c=raw.charAt(i);
    if(c==='('||c==='['||c==='{'){ depth++; buf+=c; i++; continue; }
    if(c===')'||c===']'||c==='}'){ depth=Math.max(0,depth-1); buf+=c; i++; continue; }
    if(depth===0){
      var m=PP_SPLIT_RE.exec(raw.slice(i));
      if(m && m.index===0){ parts.push(buf); buf=''; i+=m[0].length; continue; }
    }
    buf+=c; i++;
  }
  parts.push(buf);
  return parts.filter(function(p){ return p.trim(); });
}
function ppSplitLineOutsideBrackets(line){
  /* ',' ';' and ' and ' at bracket depth 0 only — Rule 109f. */
  var out=[], buf='', depth=0, i=0, s=String(line);
  while(i<s.length){
    var c=s.charAt(i);
    if(c==='('||c==='['||c==='{') depth++;
    else if(c===')'||c===']'||c==='}') depth=Math.max(0,depth-1);
    if(depth===0){
      if(c===','||c===';'){ out.push(buf); buf=''; i++; continue; }
      var m=/^\s+and\s+/i.exec(s.slice(i));
      if(m){ out.push(buf); buf=''; i+=m[0].length; continue; }
    }
    buf+=c; i++;
  }
  out.push(buf);
  return out.filter(function(p){ return p.trim(); });
}
function ppWhoTag2(x){
  /* the trailing "(Name)" a person prefix leaves behind, '' when there is none. Rule 109. */
  var m=/\(([^)]*)\)\s*$/.exec(String(x||''));
  if(m && ppRx(PP_SC.NAMES,'i').test(m[1]) && !ppRx(PP_SC.ALLWORD,'i').test(m[1]))
    return m[1].replace(/\s+/g,' ').trim().toLowerCase();
  return '';
}
function ppMealComponents(dish){
  var raw=ppSpellFix(dish);
  var parts=ppSplitTopLevel(raw), out=[];
  for(var i=0;i<parts.length;i++){
    var part=parts[i], solo=false;
    var pr=part.match(/\(([^)]*)\)/g)||[];
    for(var j=0;j<pr.length;j++)
      if(ppRx(PP_SC.NAMES,'i').test(pr[j]) && !ppRx(PP_SC.ALLWORD,'i').test(pr[j])) solo=true;
    if(ppRx(PP_SC.NAMES,'i').test(part.replace(/\([^)]*\)/g,' ')) && !ppRx(PP_SC.ALLWORD,'i').test(part)) solo=true;
    var mm=/(?:^|[^\d])(\d{1,2})\s+(?=[a-z])/i.exec(part.trim());
    var cnt=mm?parseInt(mm[1],10):null;
    var eaters=solo?ppNamedCount2(part):null;
    /* RULE 109e — "2 chapati each" for two named people is four chapatis, and "each" is not part of
       any dish name. */
    if(cnt && /\beach\b/i.test(part)) cnt = cnt * ((solo && eaters) ? eaters : 1);
    /* RULE 86d — WHO, captured from the ORIGINAL text like solo and eaters, because the tags are
       stripped before the fold below runs and it needs a boundary it can see. */
    var whos={}, nmd=String(part).match(/\(([^)]*)\)/g)||[];
    for(var wi=0; wi<nmd.length; wi++){
      var inner=nmd[wi].slice(1,-1);
      if(ppRx(PP_SC.NAMES,'i').test(inner) && !ppRx(PP_SC.ALLWORD,'i').test(inner))
        whos[inner.replace(/\s+/g,' ').trim().toLowerCase()]=1;
    }
    var who=Object.keys(whos).sort().join(',');
    var cs=ppComponents2(part.replace(ppRx(PP_SC.EACHWORD,'gi'),' '));
    for(var c=0;c<cs.length;c++) out.push({name:cs[c],count:cnt,solo:solo,eaters:eaters,who:who});
  }
  /* fold bare ingredient fragments FORWARD into the next real dish, else backward onto the last */
  var fixed=[];
  for(var ix=0; ix<out.length; ix++){
    var nm=String(out[ix].name||'').trim();
    if(ppBare(nm)){
      /* RULE 86d — a fragment may only fold into something the SAME PERSON is eating. ppMergeFragments
         has had that guard since Rule 86; this fold never did, and it is the second home for the same
         bug: y24's "carrots bell peppers" folded forward into Astha's yellow curry and the result was
         fuzzy-matched to a tamarind curry. Twin of dishkey's Rule 86d — Rule 66 fails the bake if the
         two disagree. */
      var w=String(out[ix].who||'');
      var nxt=null;
      for(var k2=ix+1;k2<out.length;k2++){
        if(!ppBare(String(out[k2].name||'')) && String(out[k2].who||'')===w){ nxt=k2; break; }
      }
      if(nxt!==null){ out[nxt].name = nm+' '+out[nxt].name; continue; }
      if(fixed.length && String(fixed[fixed.length-1].who||'')===w){
        fixed[fixed.length-1].name = fixed[fixed.length-1].name+' '+nm; continue; }
    }
    fixed.push(out[ix]);
  }
  out=fixed;
  /* collapse identical components: the planner lists per-person lines and pax already covers the
     whole household, so emitting both doubled the portion */
  var seen={}, dedup=[];
  for(var k=0;k<out.length;k++){
    /* by NAME only. Python collapses a repeated component regardless of who it was listed for:
       "Karthik & Gauri: methi paratha ... Gauri: ... with methi paratha" is one paratha line.
       Keying on name+eaters let the second copy through and over-ordered the atta. */
    var key=out[k].name;
    if(seen[key]) continue; seen[key]=1; dedup.push(out[k]);
  }
  return dedup;
}

/* ---- Rule: a fragment naming NOTHING BUT ingredient-vegetables belongs to the dish next to it.
   "Bhindi + dal + roti" -> Python folds dal into bhindi; "Tomato + Onion + Cucumber Salad" is one
   salad. This mirrors dishkey._bare and the forward-then-backward merge around it. ---- */
function ppNamedFoods(nm){
  var hits=[];
  for(var i=0;i<PP_SC.VEGLEX.length;i++){
    var lab=PP_SC.VEGLEX[i][0], kws=PP_SC.VEGLEX[i][1];
    for(var j=0;j<kws.length;j++){
      if(new RegExp('(?<![a-z])'+ppEsc(kws[j].toLowerCase())+'(e?s)?(?![a-z])','i').test(nm)){
        hits.push([lab,kws]); break;
      }
    }
  }
  return hits;
}
function ppBare(nm){
  nm=String(nm||'').trim();
  var fam = ppFamilyOf(nm);
  if(fam && PP_SC.INGREDIENT_ONLY.indexOf(fam) < 0) return false;
  var nf=ppNamedFoods(nm);
  if(!nf.length) return false;
  var rest=nm.toLowerCase();
  for(var i=0;i<nf.length;i++){
    var all=[nf[i][0]].concat(nf[i][1]);
    for(var j=0;j<all.length;j++)
      rest=rest.replace(new RegExp('(?<![a-z])'+ppEsc(String(all[j]).toLowerCase())+'(e?s)?(?![a-z])','g'),' ');
  }
  var vw=new RegExp(PP_SC.VEGWORD,'i');
  var left=rest.split(/[^a-z]+/).filter(function(w){ return w && !vw.test(w); });
  return left.length===0;
}
/* ---- needs, from the Python-computed table ---- */

/* ================================================================================================
   RULE 50 IN THE BROWSER — the specialisation step, ported so the browser resolves anything Python
   can instead of refusing. Used ONLY when the precomputed table has no entry for the component, so
   every previously-proven answer is untouched and this can only turn a refusal into an answer.
   ================================================================================================ */
function ppRound(x){                       /* Python rounds half to EVEN; JS rounds half up. */
  var f=Math.floor(x), d=x-f;
  if(Math.abs(d-0.5)>1e-9) return Math.round(x);
  return (f%2===0)?f:f+1;
}
/* TWIN of recipes_v2._NEG_CUE / _unnegated_at — Rule 66 (gate_equiv) proves these two agree.
   "no onion no garlic" names two foods the dish refuses to contain: counting them as named made
   Rule 53 demand the recipe consume them, and would have had _specialise ADD and deduct them. Each
   occurrence is judged on its own, so a food is dropped only when EVERY mention of it is negated. */
var PP_NEGCUE=/(?:^|[^a-z])(?:no|without|sans|minus)\s+$/;
function ppUnnegatedAt(tok,c){
  var re=new RegExp('(?<![a-z])'+ppEsc(tok)+'(e?s)?(?![a-z])','g'), out=[], m;
  while((m=re.exec(c))!==null){
    if(!PP_NEGCUE.test(c.slice(0,m.index))) out.push(m.index);
    if(m.index===re.lastIndex) re.lastIndex++;
  }
  return out;
}
function ppNamedFoodsFull(component){
  var c=' '+String(component||'').toLowerCase().replace(/-/g,' ')+' ', found=[];
  var lex=PP_SC.VEGFULL.slice().sort(function(a,b){
    var ma=Math.max.apply(null,a[0].map(function(t){return t.length;}));
    var mb=Math.max.apply(null,b[0].map(function(t){return t.length;}));
    return mb-ma;
  });
  for(var i=0;i<lex.length;i++){
    var toks=lex[i][0], label=lex[i][1], kws=lex[i][2];
    for(var j=0;j<toks.length;j++){
      var at=ppUnnegatedAt(toks[j],c);
      if(at.length){
        if(!found.some(function(f){return f[0]===label;})) found.push([label,kws,at[0]]);
        break;
      }
    }
  }
  var spec=PP_SC.BEANGRP.slice(0,2);
  if(found.some(function(f){return spec.indexOf(f[0])>=0;}))
    found=found.filter(function(f){return f[0]!=='Green beans';});
  found.sort(function(a,b){return a[2]-b[2];});
  return found.map(function(f){return [f[0],f[1]];});
}
function ppFamilyOfExact(component){
  var c=' '+String(component||'').toLowerCase().trim()+' ';
  var hits=PP_SC.ORDER.filter(function(k){
    return c.indexOf(' '+k+' ')>=0 || c.trim().indexOf(k)===0 || c.indexOf(k)>=0; });
  /* RULE 87 attempted and withdrawn — see recipes_v2.family_of for why. */
  if(!hits.length) return null;
  var styles=hits.filter(function(k){return PP_SC.STYLE.indexOf(k)>=0;});
  var best=hits[0];
  if(styles.length){
    if(PP_SC.STYLE.indexOf(best)>=0) return best;
    if(best.indexOf(' ')<0 && ppNamedFoodsFull(component).length>=2) return styles[0];
  }
  return best;
}
function ppFoodCat(label){
  if(PP_SC.FRUIT_L.indexOf(label)>=0) return 'fruit';
  if(PP_SC.PROTEIN_L.indexOf(label)>=0) return 'protein';
  if(PP_SC.GRAIN_L.indexOf(label)>=0) return 'grain';
  return 'veg';
}
function ppBasketCats(kws){
  var cats={};
  for(var i=0;i<kws.length;i++){
    var k=String(kws[i]).toLowerCase();
    for(var j=0;j<PP_SC.VEGFULL.length;j++){
      var toks=PP_SC.VEGFULL[j][0];
      if(toks.some(function(t){return k===t || k.indexOf(t)===0;})){ cats[ppFoodCat(PP_SC.VEGFULL[j][1])]=1; break; }
    }
  }
  var out=Object.keys(cats);
  return out.length?out:['veg'];
}
function ppSpecialise(rows, component){
  var vg=ppNamedFoodsFull(component);
  if(!vg.length) return rows;
  var out=[];
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var isBasket=(r[3]==='hero'||r[3]==='veg') && r[1].length>=3;
    if(isBasket){
      var cats=ppBasketCats(r[1]);
      var local=vg.filter(function(f){return cats.indexOf(ppFoodCat(f[0]))>=0;});
      if(!local.length){ out.push(r); continue; }
      var share=r[2]/local.length;
      local.forEach(function(f){ out.push([f[0], f[1].slice(), share, r[3]]); });
    } else out.push(r);
  }
  var blob=out.map(function(r){return (r[0]+' '+r[1].join(' ')).toLowerCase();}).join(' ');
  vg.forEach(function(f){
    var covered=[f[0]].concat(f[1]).some(function(w){
      return new RegExp('(?<![a-z])'+ppEsc(String(w).toLowerCase())+'(e?s)?(?![a-z])').test(blob); });
    if(!covered) out.push([f[0], f[1].slice(), 60, 'veg']);
  });
  return out;
}
function ppRecipeFor(name, pax, count){
  var k=ppFamilyOfExact(name);
  if(!k || !PP_SC.FAMROWS[k]) return null;
  var rows=ppSpecialise(PP_SC.FAMROWS[k].map(function(r){return [r[0],r[1].slice(),r[2],r[3]];}), name);
  var counted=PP_SC.COUNTED.indexOf(k)>=0, piece=PP_SC.PER_PIECE[k];
  /* RULE 107 — a stated serving count replaces the headcount. "1 glass" is one glass whether
     two people or ten are in the house; y25 was demanding 600 g of amla a day because both of
     their juice lines were multiplied by pax after already saying how many glasses. */
  var serving=(PP_SC.SERVING||[]).indexOf(k)>=0;
  var per = (count && serving) ? count : pax;
  return rows.map(function(r){
    var q = (count && counted && (r[3]==='carb'||r[3]==='hero')) ? count*piece : r[2]*per;
    q = (r[3]==='hero') ? ppRound(q) : Math.max(1, ppRound(q));
    return [r[0], r[1], q];
  });
}

/* ---- RULE 219 — A BARE SALAD / FRUIT SALAD / JUICE WHOSE BRACKET IS NEW ----------------------
   Jayant, 18-Sep: the Refresh button must handle brackets exactly as the run does. A bracket makes
   ONE component key — `fruit salad papaya banana` — so a combination nobody has planned before is
   not in PP_NEEDS and the board reads "No recipe". A swap as ordinary as
   `Fruit Salad (papaya, apple)` -> `(papaya, banana)` fell off the table entirely.

   SCOPED DELIBERATELY TO THE BARE DISHES, and the scope is the whole reason this is safe.

   For a bare `Salad` / `Fruit Salad` / `Juice` the engine applies ONE arithmetic rule with no tier
   decision in it (recipe_engine.pilot_bare_recipe): the bracket IS the recipe, and each named food
   gets an equal share of one serving. Verified against the engine at pax 1, 2 and 4:

       Salad (Carrot and cucumber)        40 / 80 / 160   = round(80 * pax / 2)
       Juice (Carrot, cucumber, beetroot) 27 / 53 / 107   = round(80 * pax / 3)

   EVERY OTHER BRACKET IS REFUSED, because the engine does not compose "base card + bracket" — it
   resolves a TIER over the combined name, which a table lookup cannot reproduce. Measured: an
   additive fallback got 23 of 85 real planner lines wrong, e.g. `Cut fruit (Apple)` whose component
   is `fruit apple` and whose engine answer is Apple 300, not the card plus an apple. So those stay
   a table miss: "No recipe" on the board, named by the Refresh button, priced by the next run.

   A WORD THE SHEET HAS NEVER PRICED IS SKIPPED, NOT REFUSED — the engine filters its named-foods
   list the same way, which is why `Fruit Salad (mango, grapes, apple)` divides by TWO: `grapes` is
   not priced anywhere in the sheet, and the bracket table is that same vocabulary. */
function ppSings(tok){
  /* EXACT twin of recipe_sheet._sings — every plausible singular, not a guess at the right one
     (tomatoes wants the -es rule, omelettes the -s rule; one rule gets one of them wrong). */
  var t = String(tok||''), out = [t];
  if(t.length > 4 && /ies$/.test(t)) out.push(t.slice(0,-3)+'y');
  if(t.length > 4 && /es$/.test(t) && !/ses$/.test(t)) out.push(t.slice(0,-2));
  if(t.length > 3 && /s$/.test(t) && !/ss$/.test(t)) out.push(t.slice(0,-1));
  return out;
}

/* ================ RULE 224 — THE DISH FIRST, THEN ITS BRACKET, TIMES THE PAX ==================
   Jayant, 18-Sep: *"first fetch dish, then after the recipes for dish fetched, in that add the
   bracket one according to the pax"*. One rule, and both engines now follow it: the dish is priced
   from its own card, and every food the bracket names is added on top at the sheet's per-adult
   quantity times the headcount, unless the card already carries it.

   THIS REPLACED AN ATTEMPT TO COPY THE SPLITTER'S JUDGEMENT, which failed four times and was
   measured each time. The splitter drops a bracket for reasons that have nothing to do with whether
   the cook will use the food — a plural, a stray word, a lenient pass disagreeing with the strict
   one — so a board reproducing it was 84% right and 12% of lines bought produce the close would
   never deduct. The fix was not a better copy: it was to stop having two rules. dishkey now carries
   the bracket text as written (Rule 224, _raw_parens) and recipe_engine reads THAT, so the board has
   one simple rule to follow instead of a judgement to reconstruct. */
function ppCovers(word, label, kws){
  /* Is this food already in that row? EVERY word of it must be covered, singularised on both sides.
     Matching on ANY word would read a plain "Potato" row as covering a named `sweet potato`;
     matching raw strings misses `carrots` against "Carrot" by one letter. */
  var src = String(label||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/);
  for(var k = 0; k < (kws||[]).length; k++)
    src = src.concat(String(kws[k]).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/));
  var rf = {};
  for(var i = 0; i < src.length; i++){
    if(!src[i]) continue;
    var fs = ppSings(src[i]);
    for(var j = 0; j < fs.length; j++) rf[fs[j]] = 1;
  }
  var ws = String(word||'').split(' ');
  for(var a = 0; a < ws.length; a++){
    var g = ppSings(ws[a]), hit = false;
    for(var b = 0; b < g.length; b++) if(rf[g[b]]){ hit = true; break; }
    if(!hit) return false;
  }
  return true;
}

function ppRawParens(dish){
  /* MIRROR of dishkey._raw_parens, walking the same top-level split. A bracket belongs to its part;
     a part that splits into more than one component is refused, because then there is no honest way
     to say which dish the bracket was for. Returns one entry per component, in component order. */
  var out = [];
  var parts;
  try{ parts = ppSplitTopLevel(String(dish)); }catch(e){ return null; }
  var PREP = (PP_SC && PP_SC.PREP) ? ppRx(PP_SC.PREP,'i') : null;
  var NAMES = (PP_SC && PP_SC.NAMES) ? ppRx(PP_SC.NAMES,'i') : null;
  for(var p = 0; p < parts.length; p++){
    var part = parts[p], cs;
    try{ cs = ppMealComponents(part) || []; }catch(e){ return null; }
    var raw = '';
    if(part.indexOf('(') >= 0 && cs.length === 1){
      var keep = [], rx = /\(([^)]*)\)/g, m;
      while((m = rx.exec(part)) !== null){
        var inner = m[1];
        /* A PREP INSTRUCTION OR A PERSON IS NOT AN INGREDIENT. "(Soak rajma)" is tomorrow's dish
           and "(Vikas: 3 normal)" is a portion note. Same three tests dishkey applies. */
        if((PREP && PREP.test(inner)) || (NAMES && NAMES.test(inner)) || inner.indexOf(':') >= 0
           || /\b(thaw\w*|grind\w*|defrost\w*|clean|chop)\b/i.test(inner)) continue;
        inner = inner.replace(/^\s*\+/, ' ');
        if(inner.replace(/\s/g,'')) keep.push(inner.replace(/^\s+|\s+$/g,''));
      }
      raw = keep.join(' ');
    }
    for(var c = 0; c < cs.length; c++) out.push(c === 0 ? raw : '');
  }
  return out;
}

function ppBracketFoodsRaw(raw, pid){
  /* MIRROR of recipe_engine.pilot_bracket_foods. Two tests, both the sheet's own: a TWO-word
     candidate must be an ingredient the sheet lists, a ONE-word candidate must be in its
     FOODWORDS. Foodwords and not the ingredient keys is the whole safety of this: both hold
     `ladyfinger`, only the keys hold `gravy`. */
  var meta = ppPilotMeta(pid);
  if(!meta || !meta.fw || !meta.ingn) return {foods: [], neg: {}};
  var words = String(raw||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);
  if(!words.length) return {foods: [], neg: {}};
  var fw = {}, ingn = {}, ingw = {}, qual = {}, place = {};
  for(var a=0;a<meta.fw.length;a++) fw[meta.fw[a]] = 1;
  for(var b=0;b<meta.ingn.length;b++) ingn[meta.ingn[b]] = 1;
  for(var b2=0;b2<(meta.ingw||[]).length;b2++) ingw[meta.ingw[b2]] = 1;
  for(var c=0;c<(meta.qual||[]).length;c++) qual[meta.qual[c]] = 1;
  for(var d=0;d<(meta.place||[]).length;d++) place[meta.place[d]] = 1;
  var head = meta.head ? ppRx('^(?:'+meta.head+')$','i') : null;
  var negRx = meta.neg ? ppRx('^(?:'+meta.neg.replace(/\\b/g,'')+')$','i') : null;
  var neg = {};
  if(negRx) for(var i=0;i<words.length;i++){
    if(!negRx.test(words[i])) continue;
    for(var k=i+1;k<=i+3 && k<words.length;k++){
      if(fw[words[k]] || ingn[words[k]]){ neg[words[k]] = 1; break; }
    }
  }
  var out = [], at = 0;
  while(at < words.length){
    var took = 0;
    for(var n = 2; n >= 1; n--){            /* LONGEST MATCH FIRST — "spring onion" is one food */
      if(at + n > words.length) continue;
      var parts2 = words.slice(at, at+n), cand = parts2.join(' '), bad = false;
      for(var z=0;z<parts2.length;z++) if(neg[parts2[z]]) bad = true;
      if(bad || neg[cand] || place[cand] || qual[cand]) continue;
      if(head && head.test(parts2[parts2.length-1])) continue;
      if(!(n === 2 ? ingn[cand] : fw[cand])) continue;
      /* AND it must be an ingredient in its own right — the second test pilot_apply applies.
         `with` is a foodword (some sheet row is named "... with ..."), and without this it was
         bought as 112 g of With. */
      if(!(ingn[cand] || (n === 1 && ingw[cand]))) continue;
      if(out.indexOf(cand) < 0) out.push(cand);
      took = n; break;
    }
    at += took || 1;
  }
  return {foods: out, neg: neg};
}

function ppBracketAdd(rows, raw, pax, pid, shared, pf){
  /* The dish is already priced; this puts the bracket's foods into it, per adult times the pax. */
  var meta = ppPilotMeta(pid);
  if(!meta) return;
  var got = ppBracketFoodsRaw(raw, pid);
  for(var f = 0; f < got.foods.length; f++){
    var word = got.foods[f], covered = false;
    for(var r = 0; r < rows.length && !covered; r++) covered = ppCovers(word, rows[r][0], rows[r][1]);
    if(covered) continue;                      /* already in the dish — never add it twice */
    var t = (meta.bracket || {})[word], q, prod;
    if(t){ q = Math.max(1, ppRound(t[2] * Math.max(1, pax))); prod = !!t[4]; }
    else {
      /* RULE 226 — the sheet NAMES this food but never prices it, so it gets the default serving.
         Whether Rule 133's 70% applies is a WORKBOOK decision and is baked per word: assuming
         produce here priced `(pork)` at 112 g against the close's 160. */
      q = (meta.produce_g || 80) * Math.max(1, pax);
      prod = !!((meta.prod || {})[word]);
    }
    if(shared && prod) q = q * pf;
    var lab = word.replace(/(^|\s)([a-z])/g, function(_m, x, y){ return x + y.toUpperCase(); });
    rows.push([lab, [word], q, 'base']);
  }
}

function ppPilotMeta(pid){
  if(!pid) return null;
  var m = PP_NEEDS['\u0001new\u0001'];
  if(!m || !m.households || m.households.indexOf(String(pid)) < 0) return null;
  return m;
}

function ppBracketRefused(label, kws, neg, pid){
  /* RULE 221 — does a bracket refusal name this row? */
  var meta = ppPilotMeta(pid);
  if(!meta || !meta.bracket) return false;
  var words = String(label || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
  for(var i = 0; i < words.length; i++){
    var w = words[i];
    if(!w || !neg[w]) continue;
    /* the refused word must be something the sheet sells, or "no" + a stray word deletes a line */
    if(Object.prototype.hasOwnProperty.call(meta.bracket, w)) return true;
  }
  return false;
}

function ppBareBracket(name, raw, pax, pid){
  /* RULE 225 — THE BARE RULE, ASKED THE WAY THE CLOSE ASKS IT.

     `recipe_engine._recipe_core` calls `pilot_bare_recipe(name + bracket)` FIRST, before it looks at
     any card at all. This used to be reachable only when the table MISSED, and that inversion is the
     whole defect: `Salad Rice (coriander, muskmelon, lemongrass)` has a `salad rice` row in the
     table, so the board answered from it and then bolted the bracket foods on at their individual
     amounts, while the close ignored the card and split ONE serving across rice, coriander and
     lemongrass. Two defensible rules, different answers, no gate able to see it.

     THE FOODS COME FROM THE WHOLE LINE, not from the bracket alone. `pilot_bare_recipe` reads the
     name AND the bracket — for `salad rice (coriander...)` the rice is named by the DISH and is one
     of the things being divided. Taking only bracket words dropped it.

     AND FROM THE SAME EXTRACTOR AS EVERYTHING ELSE. `ppBracketFoodsRaw` is now the single answer to
     "is this word a food" on this side, as `pilot_bracket_foods` is on the other — so the bare rule
     and the additive rule cannot disagree about a word, which is how `muskmelon` ended up in one
     list and not the other. It also applies the category-head filter, so the `salad`/`juice`/`fruit`
     in the dish's own name is never itself priced as an ingredient. */
  var meta = ppPilotMeta(pid);
  if(!meta || !meta.bare) return null;
  /* ANCHORED, like PILOT_BARE: a NAMED salad ("Cucumber Salad") is not caught by this and keeps its
     own card. Only a line that BEGINS "salad" / "fruit salad" / "juice" is the bracket itself. */
  if(!ppRx(meta.bare, 'i').test(String(name || ''))) return null;
  var got = ppBracketFoodsRaw(String(name || '') + ' ' + String(raw || ''), pid);
  var foods = got.foods;
  if(!foods.length) return null;

  var pg = meta.produce_g || 80, lines = [], q = [], pxN = 8;
  for(var px = 0; px < pxN; px++) q.push([]);
  for(var f = 0; f < foods.length; f++){
    var b0 = (meta.bracket || {})[foods[f]];
    var lab = b0 ? b0[0] : foods[f].replace(/(^|\s)([a-z])/g,
                     function(_m, a, b){ return a + b.toUpperCase(); });
    var kws = b0 ? b0[1] : [foods[f]];
    var isProd = b0 ? !!b0[4] : !!((meta.prod || {})[foods[f]]);   /* RULE 226 */
    lines.push([lab, kws, 'hero', null, isProd]);
    for(var p0 = 0; p0 < pxN; p0++)
      q[p0].push(Math.max(1, ppRound(pg * (p0 + 1) / foods.length)));
  }
  return {lines: lines, q: q, piece: null, serving: false};
}

function ppNeedsForComps(comps, pax, pid, bracketWords, bracketNeg){
  /* The body of ppNeedsFor, taking COMPONENTS instead of raw planner text.
     Split out (v21_480) because the same-day inventory correction has to cost two menus that
     arrive in different forms — one as raw planner text, one as the normalised dish string the
     close already wrote to the ledger — and ppPlannerToDish is NOT idempotent: it rewrites
     "(Karthik, Astha)" as "(Karthik; Astha)", which re-reads as ONE eater instead of two.
     Running it twice over an already-normalised dish therefore changes the quantities. Costing
     from components lets both sides reach this function by exactly one normalisation each. */
  var per=[], missing=[];
  /* RULE 219 — the words the planner actually bracketed. Absent, the fallback is simply off. */
  var _allow = bracketWords || null;
  /* RULE 133 — veg and fruit at 70% once a dish feeds more than one. The FACTOR comes from PP_SC,
     exported from dedlib by export_split_consts (Rule 76's precedent: the browser uses the close's
     number, never a copy of it). Absent, this REFUSES rather than pricing the menu at 100%: a
     shopping list quietly 30% high on every vegetable is the exact silent-wrong-number Rule 110f
     chose refusal over. Rule 66 would also catch it, but not before a hand-built bundle shipped. */
  var _pf = PP_SC.SHARED_PRODUCE;
  if(!(_pf > 0))
    return {per:[], missing:['Rule 133 factor missing from PP_SC — refusing to price this menu']};
  for(var i=0;i<comps.length;i++){
    var m=comps[i];
    /* RULE 225 — THE ORDER IS THE CLOSE'S ORDER. `_recipe_core` asks the bare rule before it asks
       for a card, so this does too. Asking the table first is what let a `salad rice` row answer a
       line whose bracket IS its recipe. */
    var _bare = ppBareBracket(m.name, m._raw, pax, pid);
    var e = _bare || PP_NEEDS[m.name];
    /* RULE 213 — THE FOUR PILOT HOUSEHOLDS READ THEIR OWN SHEET'S ANSWER. PP_NEEDS is keyed by
       component NAME alone, which was right while one Recipe Master priced everybody; the pilot
       made the same name mean two different recipes. build_needspp bakes the pilot's answer under
       a "\u0001new\u0001" prefix for every component where it DIFFERS, and this is the only place
       that reads it. Without it y31's "Panta bhat peanut curd" showed the estate's lone
       `Peanut curd 120 g` on the handover while the close deducted the sheet's Panta Bhat card —
       the board and the ledger disagreeing about one meal.
       Falls through to the estate entry when there is no pilot key, which is both the common case
       (the answers are identical) and the correct behaviour for a bundle built before this. */
    var _pl = PP_NEEDS['\u0001new\u0001'];
    if(pid && !_bare){
      /* The household list comes from the TABLE, not from PP_PILOT: that constant is spliced into
         the main bundle and is NOT present in needs-runtime.generated.js, so reading it here left
         the guard permanently false in the one context that prices the handover. */
      if(_pl && _pl.households && _pl.households.indexOf(String(pid))>=0){
        var _pe = PP_NEEDS['\u0001new\u0001'+m.name];
        if(_pe) e = _pe;
      }
    }
    if(!e){
      /* RULE 110f — REFUSE, DO NOT GUESS FROM THE OLD LIBRARY.
         This used to fall through to ppRecipeFor, a port of recipes_v2 carrying the browser's own
         copy of the family table. That was defensible while Python and the browser shared one
         library. They no longer do: quantities now come from Jayant's Recipe Master sheet, so the
         fallback would have quietly shown OLD numbers in the cart while the ledger deducted the
         sheet's — the two disagreeing, with nothing on screen to say which you were looking at.
         PP_NEEDS covers 2,726 components (it covered 452 before), so this path is now rare, and a
         household marked stale is a visible, honest inconvenience. Rule 66's own words: a wrong
         quantity in a food inventory is the whole thing we are trying to prevent; a refusal is
         merely inconvenient. */
      /* RULE 224 — otherwise the DISH is in the table even when dish-plus-bracket is not.
         `Vegetable stew (mushroom, corn)` keys as `vegetable stew mushroom corn`, which no run has
         ever seen; `vegetable stew` is right there. Price the dish; the bracket is added below.
         Asked AFTER the bare rule, so a salad whose bracket IS its recipe never gets a generic
         salad card instead. */
      if(m._base && m._base !== m.name){
        var _onPilot = pid && _pl && _pl.households && _pl.households.indexOf(String(pid)) >= 0;
        e = (_onPilot ? PP_NEEDS['\u0001new\u0001' + m._base] : null) || PP_NEEDS[m._base] || null;
      }
      if(!e){ missing.push(m.name); continue; }
    }
    var p = (m.solo && m.eaters) ? m.eaters : pax;
    /* Rule 133 asks how many mouths share the PAN, which is this number and not the serving count
       applied just below: "2 amla juice" is two glasses, not two eaters. Captured before the count
       can overwrite p, exactly as dedlib.cook_meal reads _eaters before it looks at anything else. */
    var _shared = p > 1;
    /* RULE 110h / 107 — a stated serving count replaces the headcount for a drink. One glass is one
       glass whether two people or ten are in the house; y25 was demanding 600 g of amla a day because
       both of their juice lines were multiplied by pax after already saying how many glasses. The
       `serving` flag is baked by Python from the matched sheet dish, so this is a table lookup at a
       different index rather than a rule the browser has to know. */
    if(m.count && e.serving && !(m.solo && m.eaters)) p = m.count;
    if(!(p>=1) || p>e.q.length){ missing.push(m.name+' @'+p+' eating'); continue; }
    var qs=e.q[p-1], rows=[];
    for(var L=0;L<e.lines.length;L++){
      var lab=e.lines[L][0], kws=e.lines[L][1], cls=e.lines[L][2], cq=e.lines[L][3], q=qs[L];
      /* Rule 110e — the table says which lines a stated count governs, and what one unit costs.
         No class test here on purpose: deciding that in two languages is what let the browser put
         2 ml of milk in an omelette. */
      if(m.count && cq !== null && cq !== undefined){
        q = m.count * cq;
        q = (cls==='hero') ? Math.round(q) : Math.max(1, Math.round(q));
      }
      /* Rule 133, applied AFTER the count override for the same reason the close applies it after
         the recipe has been built: it scales whatever this line finally costs, however that figure
         was arrived at. The flag is baked per line by build_needspp — the browser has no workbook
         and so cannot ask what food group a thing is (Rule 110e: bake the decision).
         Unrounded, like the Python side: the totals are rounded once, at the end, in ppTotals. */
      if(_shared && e.lines[L][4]) q = q * _pf;
      /* RULE 110c — carry the CLASS through, so the Handover tab can tag optional and
         base-optional the way Jayant asked. It was already in the table and dropped here. */
      /* RULE 221 — the bracket refused this food. Only a word the pilot sheet actually sells can
         refuse anything (`bracket` is that vocabulary), so a stray "not" before a non-food cannot
         delete a line. Matched on the row's own label, in whole words, so "no onion" takes Onion
         and leaves Spring Onion — the close's own test is the same shape. */
      if(bracketNeg && ppBracketRefused(lab, kws, bracketNeg, pid)) continue;
      rows.push([lab, kws, q, cls]);
    }
    /* RULE 224 — then the bracket, per adult x pax. Runs for every component that carries one:
       where the table already answered the whole phrase the foods are present and the guard inside
       skips them, so this only ever fills a gap. */
    /* Not when the bare rule answered: there the bracket IS the recipe and its foods are already
       every line of it, so adding them again would both duplicate and re-price them. */
    if(m._raw && !_bare) ppBracketAdd(rows, m._raw, p, pid, _shared, _pf);
    per.push([m.name, rows]);
  }
  return {per:per, missing:missing};
}
function ppNeedsFor(text, pax, pid){
  /* Returns needs PER COMPONENT, in the same shape NEXTMENU already uses:
     [componentName, [[label, keywords, qty], ...]]. Keeping the component split means the cart's
     "Needed for" column still names the component rather than the whole slot. */
  /* RULE 219 — READ THE BRACKET HERE, where the raw text still exists. Collected as single words
     AND whole phrases, because a bracket food can be two words ("peanut curd"). */
  var _bw = null, _neg = null, _mm, _rx = /\(([^)]*)\)/g, _t = String(text || '');
  while((_mm = _rx.exec(_t)) !== null){
    var _in = String(_mm[1]).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if(!_in) continue;
    _bw = _bw || {};
    var _ws = _in.split(' ');
    for(var _a = 0; _a < _ws.length; _a++)
      for(var _b = _a + 1; _b <= _ws.length; _b++) _bw[_ws.slice(_a, _b).join(' ')] = 1;
    /* RULE 221 — A BRACKET CAN REFUSE A FOOD, AND THE BOARD HAS TO HONOUR IT.
       `mixed veg salad (Including corn and No cucumber)` was showing Cucumber 114 g on the board
       while the close removed it: pilot_apply reads the refusal (PILOT_NEG below, mirrored word for
       word) and drops the card's own line, and the table cannot carry that because it is keyed by
       component NAME and the refusal belongs to one occurrence. Read here, where the raw text is.
       The refusal reaches the next three tokens, as the close's does, so "no onion" and
       "not include onion" are both caught without running to the end of the line. */
    for(var _n = 0; _n < _ws.length; _n++){
      if(!/^(?:no|without|skip|avoid|not)$/.test(_ws[_n])) continue;
      for(var _k = _n + 1; _k <= _n + 3 && _k < _ws.length; _k++){
        (_neg = _neg || {})[_ws[_k]] = 1;
      }
    }
  }
  var _dish = ppPlannerToDish(text);
  var _comps = ppMealComponents(_dish);
  if(/\(/.test(String(_dish||''))){
    /* RULE 224 — the bracket as written, per component, aligned by the same top-level split
       dishkey uses. Attached only when the two agree on how many components there are. */
    var _raw = ppRawParens(_dish);
    if(_raw && _raw.length === _comps.length)
      for(var _r = 0; _r < _comps.length; _r++) _comps[_r]._raw = _raw[_r];
    /* the DISH on its own, for the table lookup when the glued name is new */
    try{
      var _np2 = ppMealComponents(String(_dish).replace(/\([^)]*\)/g, ' '));
      if(_np2 && _np2.length === _comps.length)
        for(var _b2 = 0; _b2 < _comps.length; _b2++) _comps[_b2]._base = _np2[_b2].name;
    }catch(e){}
  }
  return ppNeedsForComps(_comps, pax, pid, _bw, _neg);
}
function ppTotals(per){
  var t={};
  for(var i=0;i<per.length;i++)
    for(var j=0;j<per[i][1].length;j++){
      var r=per[i][1][j];
      t[r[0]]=Math.round(((t[r[0]]||0)+r[2])*1000)/1000;
    }
  return t;
}
if (typeof module!=='undefined') module.exports={ppNeedsFor:ppNeedsFor,ppTotals:ppTotals,ppPlannerToDish:ppPlannerToDish,ppMealComponents:ppMealComponents};

/**
 * Generates HSN/SAC code data files in data/hsn/
 * Source: CBIC GST Rate Schedule (Notification 1/2017-CT(Rate) and amendments)
 * Run: npx tsx scripts/generate-hsn-data.ts
 */

import fs from "fs";
import path from "path";

export interface HSNRecord {
  code: string;         // e.g. "9954"
  type: "HSN" | "SAC"; // HSN = goods, SAC = services
  description: string;
  gstRate: number;      // IGST % (GST = CGST + SGST = half each)
  chapter: string;      // 2-digit chapter code
  chapterName: string;
  examples: string[];   // common goods/services under this code
  notes?: string;
}

// HSN Chapters (2-digit)
const CHAPTERS: Record<string, string> = {
  "01": "Live Animals",
  "02": "Meat & Edible Offals",
  "03": "Fish & Seafood",
  "04": "Dairy, Eggs, Honey",
  "05": "Other Animal Products",
  "06": "Live Plants & Flowers",
  "07": "Edible Vegetables",
  "08": "Edible Fruits & Nuts",
  "09": "Coffee, Tea, Spices",
  "10": "Cereals",
  "11": "Milling Products",
  "12": "Oil Seeds",
  "13": "Lac, Gums, Resins",
  "14": "Vegetable Plaiting Materials",
  "15": "Animal & Vegetable Fats",
  "16": "Prepared Meat/Fish",
  "17": "Sugars",
  "18": "Cocoa & Preparations",
  "19": "Cereal Preparations",
  "20": "Preparations of Vegetables/Fruit",
  "21": "Miscellaneous Food Preparations",
  "22": "Beverages & Spirits",
  "23": "Animal Feed",
  "24": "Tobacco",
  "25": "Salt, Sulphur, Earths, Stone",
  "26": "Ores, Slag, Ash",
  "27": "Mineral Fuels & Oils",
  "28": "Inorganic Chemicals",
  "29": "Organic Chemicals",
  "30": "Pharmaceutical Products",
  "31": "Fertilisers",
  "32": "Tanning & Dyeing Extracts",
  "33": "Essential Oils & Cosmetics",
  "34": "Soap, Washing Preparations",
  "35": "Albuminoidal Substances, Glues",
  "36": "Explosives, Pyrotechnics",
  "37": "Photographic Products",
  "38": "Miscellaneous Chemical Products",
  "39": "Plastics",
  "40": "Rubber & Articles",
  "41": "Raw Hides, Skins & Leather",
  "42": "Articles of Leather",
  "43": "Furskins & Artificial Fur",
  "44": "Wood & Articles",
  "45": "Cork & Articles",
  "46": "Manufactures of Straw",
  "47": "Pulp of Wood",
  "48": "Paper & Paperboard",
  "49": "Printed Books, Newspapers",
  "50": "Silk",
  "51": "Wool",
  "52": "Cotton",
  "53": "Other Vegetable Textile Fibres",
  "54": "Man-Made Filaments",
  "55": "Man-Made Staple Fibres",
  "56": "Wadding, Felt, Nonwovens",
  "57": "Carpets & Textile Floor Coverings",
  "58": "Special Woven Fabrics",
  "59": "Impregnated Textile Fabrics",
  "60": "Knitted or Crocheted Fabrics",
  "61": "Knitted Apparel",
  "62": "Woven Apparel",
  "63": "Other Textile Articles",
  "64": "Footwear",
  "65": "Headgear",
  "66": "Umbrellas, Walking Sticks",
  "67": "Prepared Feathers, Artificial Flowers",
  "68": "Articles of Stone, Plaster, Cement",
  "69": "Ceramic Products",
  "70": "Glass & Glassware",
  "71": "Precious Stones & Metals",
  "72": "Iron & Steel",
  "73": "Articles of Iron or Steel",
  "74": "Copper & Articles",
  "75": "Nickel & Articles",
  "76": "Aluminium & Articles",
  "78": "Lead & Articles",
  "79": "Zinc & Articles",
  "80": "Tin & Articles",
  "81": "Other Base Metals",
  "82": "Tools & Cutlery of Base Metal",
  "83": "Miscellaneous Articles of Base Metal",
  "84": "Nuclear Reactors, Machinery, Computers",
  "85": "Electrical Machinery & Electronics",
  "86": "Railway Locomotives",
  "87": "Vehicles (Cars, Bikes, Trucks)",
  "88": "Aircraft & Spacecraft",
  "89": "Ships & Boats",
  "90": "Optical, Photographic, Medical Instruments",
  "91": "Clocks & Watches",
  "92": "Musical Instruments",
  "93": "Arms & Ammunition",
  "94": "Furniture, Bedding, Mattresses",
  "95": "Toys, Games, Sports Equipment",
  "96": "Miscellaneous Manufactured Articles",
  "97": "Works of Art, Antiques",
  "98": "Project Imports, Lab Chemicals",
  "99": "Services (SAC Codes)",
};

// Comprehensive HSN/SAC records — based on CBIC GST Rate Schedule
// Format: [code, type, description, gstRate, examples[], notes?]
const RAW_RECORDS: [string, "HSN"|"SAC", string, number, string[], string?][] = [
  // ── CHAPTER 1–9: Agriculture & Food ──────────────────────────────────────
  ["0101","HSN","Live horses, asses, mules, hinnies",0,["horses","donkeys","mules"]],
  ["0102","HSN","Live bovine animals",0,["cows","buffaloes","bulls","oxen"]],
  ["0201","HSN","Meat of bovine animals, fresh or chilled",0,["beef","veal"]],
  ["0202","HSN","Meat of bovine animals, frozen",0,["frozen beef"]],
  ["0207","HSN","Meat of poultry, fresh/chilled/frozen",5,["chicken","duck","turkey"]],
  ["0301","HSN","Live fish",0,["live fish","ornamental fish"]],
  ["0302","HSN","Fish, fresh or chilled",0,["fresh fish","rohu","catla","pomfret"]],
  ["0303","HSN","Fish, frozen",5,["frozen fish","frozen prawns"]],
  ["0304","HSN","Fish fillets & other fish meat",5,["fish fillet","fish finger"]],
  ["0306","HSN","Crustaceans (prawns, shrimps, crabs)",5,["prawns","shrimps","crabs","lobster"]],
  ["0401","HSN","Milk and cream, not concentrated or sweetened",0,["fresh milk","cream"]],
  ["0402","HSN","Milk and cream, concentrated or sweetened",5,["condensed milk","milk powder","baby formula"]],
  ["0403","HSN","Buttermilk, curd, yoghurt, kephir",5,["curd","yoghurt","buttermilk","lassi"]],
  ["0404","HSN","Whey",5,["whey protein","whey powder"]],
  ["0405","HSN","Butter and other fats derived from milk",12,["butter","ghee"]],
  ["0406","HSN","Cheese and curd",12,["cheese","paneer"]],
  ["0407","HSN","Birds eggs, in shell",0,["eggs","hen eggs","duck eggs"]],
  ["0409","HSN","Natural honey",0,["honey","natural honey"]],
  ["0701","HSN","Potatoes, fresh or chilled",0,["potatoes","aloo"]],
  ["0702","HSN","Tomatoes, fresh or chilled",0,["tomatoes"]],
  ["0703","HSN","Onions, shallots, garlic, leeks",0,["onions","garlic","leeks"]],
  ["0706","HSN","Carrots, turnips, beetroot, radishes",0,["carrots","beetroot","radishes"]],
  ["0710","HSN","Vegetables (frozen)",0,["frozen peas","frozen corn","frozen vegetables"]],
  ["0801","HSN","Coconuts, Brazil nuts, cashew nuts",0,["coconuts","cashew nuts"]],
  ["0802","HSN","Other nuts — almonds, walnuts, pistachios",5,["almonds","walnuts","pistachios","peanuts"]],
  ["0803","HSN","Bananas, plantains",0,["bananas","plantains"]],
  ["0804","HSN","Dates, figs, pineapples, mangoes",0,["dates","mangoes","pineapples"]],
  ["0805","HSN","Citrus fruit — oranges, lemons",0,["oranges","lemons","limes","grapefruits","mosambi"]],
  ["0901","HSN","Coffee",0,["coffee beans","green coffee"]],
  ["0902","HSN","Tea",5,["tea leaves","black tea","green tea","chai"]],
  ["0904","HSN","Pepper",0,["black pepper","white pepper","pepper powder"]],
  ["0910","HSN","Ginger, saffron, turmeric, thyme",0,["ginger","turmeric","haldi","saffron","cardamom"]],
  ["1001","HSN","Wheat and meslin",0,["wheat","atta","flour"]],
  ["1006","HSN","Rice",0,["rice","basmati","paddy"]],
  ["1101","HSN","Wheat or meslin flour (atta)",0,["wheat flour","atta","maida"]],
  ["1201","HSN","Soya beans",0,["soya beans","soybean"]],
  ["1206","HSN","Sunflower seeds",0,["sunflower seeds"]],
  ["1207","HSN","Other oil seeds — mustard, sesame, linseed",0,["mustard seeds","sesame","til","linseed"]],
  ["1501","HSN","Pig fat (lard)",0,["lard"]],
  ["1507","HSN","Soya-bean oil",5,["soybean oil"]],
  ["1511","HSN","Palm oil",5,["palm oil"]],
  ["1512","HSN","Sunflower-seed, safflower or cotton-seed oil",5,["sunflower oil","safflower oil"]],
  ["1514","HSN","Rapeseed, colza or mustard oil",5,["mustard oil","rapeseed oil","sarson ka tel"]],
  ["1701","HSN","Cane or beet sugar (white/refined)",5,["sugar","cane sugar","refined sugar"]],
  ["1703","HSN","Molasses",18,["molasses"]],
  ["1801","HSN","Cocoa beans",0,["cocoa beans"]],
  ["1804","HSN","Cocoa butter, fat and oil",18,["cocoa butter"]],
  ["1805","HSN","Cocoa powder",18,["cocoa powder"]],
  ["1806","HSN","Chocolate and food preparations containing cocoa",18,["chocolate","chocolate bars","cocoa preparations"]],
  ["1901","HSN","Malt extract, cereal preparations, baby food",18,["Horlicks","Boost","baby food","cereal preparations"]],
  ["1902","HSN","Pasta, macaroni, noodles, couscous",18,["noodles","pasta","macaroni","vermicelli"]],
  ["1905","HSN","Bread, pastry, cakes, biscuits",18,["biscuits","bread","rusk","cakes","pastry","wafers"]],
  ["2009","HSN","Fruit juices, vegetable juices",12,["fruit juice","orange juice","mango juice","mixed fruit juice"]],
  ["2101","HSN","Extracts of coffee, tea, chicory",18,["instant coffee","tea extracts","coffee powder"]],
  ["2104","HSN","Soups and broths",18,["instant soup","soup packets"]],
  ["2106","HSN","Food preparations not elsewhere specified",18,["protein powder","health drinks","food supplements"]],
  ["2201","HSN","Water — mineral water, aerated water",18,["mineral water","soda water","packaged drinking water"]],
  ["2202","HSN","Flavoured/sweetened waters, soft drinks, energy drinks",28,["cola","pepsi","soft drinks","energy drinks","fruit-flavoured drinks"],"Aerated drinks with sugar: 28%"],
  ["2204","HSN","Wine of fresh grapes",0,["wine"],"Note: GST on alcohol set by states"],
  ["2207","HSN","Undenatured ethyl alcohol",18,["ethyl alcohol","ethanol"]],
  ["2208","HSN","Spirits, liqueurs, whisky, rum, gin, vodka",0,["whisky","rum","gin","vodka","brandy"],"Alcohol for human consumption: taxed by state"],
  ["2401","HSN","Unmanufactured tobacco",0,["tobacco leaves"]],
  ["2402","HSN","Cigars, cigarettes, cheroots, cigarillos",28,["cigarettes","cigars","bidi"],"+ cess applies"],
  ["2403","HSN","Other manufactured tobacco — khaini, gutkha",28,["gutkha","khaini","pan masala","chewing tobacco"],"+ cess applies"],

  // ── CHAPTER 25–27: Minerals & Fuels ──────────────────────────────────────
  ["2501","HSN","Salt — table salt, sea salt, rock salt",0,["salt","table salt","iodised salt"]],
  ["2523","HSN","Portland cement, aluminous cement",28,["cement","OPC cement","PPC cement"]],
  ["2701","HSN","Coal, briquettes, ovoids",5,["coal","lignite","coke"]],
  ["2710","HSN","Petroleum oils, motor spirits, diesel",18,["petrol","diesel","kerosene","furnace oil","LDO"],"Actual GST component only; also has excise duty"],
  ["2711","HSN","Petroleum gases — LPG, CNG, natural gas",5,["LPG","CNG","natural gas","PNG"],"LPG for household: 5%"],

  // ── CHAPTER 28–38: Chemicals ──────────────────────────────────────────────
  ["2835","HSN","Phosphinates, phosphonates, phosphates",12,["triple superphosphate","DAP fertiliser"]],
  ["2917","HSN","Polycarboxylic acids — PTA, adipic acid",18,["PTA","polyester raw material"]],
  ["3004","HSN","Medicaments (medicines, drugs)",5,["medicines","drugs","tablets","capsules","injections","insulin"],"Most medicines: 5%; some lifesaving drugs: 0%"],
  ["3005","HSN","Wadding, gauze, bandages, dressings",12,["bandages","surgical dressings","plasters"]],
  ["3301","HSN","Essential oils",18,["essential oils","rose oil","sandalwood oil","perfume base"]],
  ["3302","HSN","Mixtures of odoriferous substances",18,["fragrance compounds","aroma chemicals"]],
  ["3303","HSN","Perfumes and toilet waters",28,["perfumes","cologne","deodorant sprays"]],
  ["3304","HSN","Beauty or make-up preparations — lipstick, foundation, mascara",28,["lipstick","foundation","mascara","blush","eyeshadow","kajal"]],
  ["3305","HSN","Hair preparations — shampoo, hair oil, hair dye",18,["shampoo","conditioner","hair oil","hair dye","hair spray"]],
  ["3306","HSN","Oral hygiene preparations — toothpaste, mouthwash",18,["toothpaste","toothbrush","mouthwash"]],
  ["3307","HSN","Shaving preparations, deodorants, bath preparations",18,["shaving cream","deodorant","body wash","bath soap"]],
  ["3401","HSN","Soap and organic surface-active products",18,["toilet soap","laundry soap","soap bars"]],
  ["3402","HSN","Washing and cleaning preparations",18,["detergent","washing powder","dishwash liquid","surface cleaner"]],
  ["3406","HSN","Candles, tapers, night lights",12,["candles","wax candles","birthday candles"]],
  ["3808","HSN","Insecticides, rodenticides, disinfectants",18,["mosquito coil","mosquito repellent","pesticides","disinfectants","sanitizer"]],

  // ── CHAPTER 39–40: Plastics & Rubber ──────────────────────────────────────
  ["3901","HSN","Polymers of ethylene (polyethylene)",18,["polyethylene","HDPE","LDPE","plastic granules"]],
  ["3916","HSN","Monofilament, rods, sticks of plastics",18,["plastic pipes","plastic rods"]],
  ["3917","HSN","Tubes, pipes, hoses of plastics",18,["plastic pipes","PVC pipes","HDPE pipes"]],
  ["3919","HSN","Self-adhesive plates, sheets of plastics",18,["sticky tape","adhesive sheets","bubble wrap"]],
  ["3923","HSN","Articles for packing goods — plastic bags, bottles",18,["plastic bags","plastic bottles","plastic containers"]],
  ["4011","HSN","New pneumatic tyres of rubber",28,["car tyres","truck tyres","two-wheeler tyres","tractor tyres"]],
  ["4016","HSN","Other articles of vulcanised rubber",28,["rubber gloves","rubber bands","rubber seals"]],

  // ── CHAPTER 44–49: Wood, Paper ────────────────────────────────────────────
  ["4418","HSN","Builders' joinery and carpentry of wood",12,["wooden doors","wooden windows","wooden furniture components"]],
  ["4802","HSN","Uncoated paper and paperboard",12,["printing paper","writing paper","A4 paper","notebook paper"]],
  ["4901","HSN","Printed books, brochures, leaflets",0,["books","textbooks","novels","printed books"]],
  ["4902","HSN","Newspapers, journals, periodicals",0,["newspapers","magazines","periodicals"]],
  ["4903","HSN","Children's picture, drawing, colouring books",0,["children's books","colouring books","drawing books"]],
  ["4907","HSN","Unused postage, revenue stamps, banknotes",0,["postage stamps","cheque forms","share certificates"]],
  ["4911","HSN","Other printed matter — calendars, posters",12,["calendars","posters","printed cards","greeting cards"]],

  // ── CHAPTER 50–63: Textiles ────────────────────────────────────────────────
  ["5201","HSN","Cotton, not carded or combed",0,["raw cotton","kapas"]],
  ["5208","HSN","Woven fabrics of cotton ≤200 g/m²",5,["cotton fabric","cotton cloth","khadi"]],
  ["5209","HSN","Woven fabrics of cotton >200 g/m²",5,["heavy cotton fabric","denim"]],
  ["5303","HSN","Jute and other textile bast fibres",0,["jute","raw jute"]],
  ["5407","HSN","Woven fabrics of synthetic filament yarn",5,["polyester fabric","nylon fabric"]],
  ["5503","HSN","Synthetic staple fibres — polyester, nylon",18,["polyester fibre","nylon fibre","acrylic fibre"]],
  ["5601","HSN","Wadding of textile materials — cotton wool",12,["cotton wool","surgical cotton"]],
  ["6001","HSN","Pile fabrics, knitted or crocheted",5,["velvet","corduroy","terry fabric"]],
  ["6101","HSN","Men's overcoats, car-coats, jackets (knitted)",5,["jackets","coats","sweaters"],"Apparel ≤Rs.1000: 5%; >Rs.1000: 12%"],
  ["6109","HSN","T-shirts, singlets and other vests",5,["T-shirts","vests","sleeveless shirts"]],
  ["6203","HSN","Men's suits, jackets, trousers (woven)",5,["suits","trousers","formal wear","blazers"]],
  ["6204","HSN","Women's suits, jackets, dresses (woven)",5,["sarees","salwar kameez","women's suits","dresses"]],
  ["6302","HSN","Bed linen, table linen, toilet/kitchen linen",5,["bedsheets","pillow covers","tablecloth","towels"]],
  ["6305","HSN","Sacks and bags for packing",12,["jute bags","PP woven bags","cement bags","rice bags"]],
  ["6401","HSN","Waterproof footwear with rubber soles",18,["rubber boots","gumboots","waterproof shoes"]],
  ["6402","HSN","Other footwear with rubber soles",18,["sports shoes","sandals","chappals","canvas shoes"]],
  ["6403","HSN","Footwear with leather uppers",18,["leather shoes","formal shoes","boots"]],
  ["6404","HSN","Footwear with textile uppers",5,["canvas shoes","jute footwear"],"≤Rs.1000: 5%"],

  // ── CHAPTER 68–71: Stone, Ceramic, Glass, Precious ───────────────────────
  ["6802","HSN","Worked monumental or building stone",12,["granite slabs","marble","stone tiles"]],
  ["6810","HSN","Articles of cement, concrete, artificial stone",28,["concrete pipes","cement blocks","RCC pipes"]],
  ["6901","HSN","Bricks, blocks, tiles of siliceous fossil meals",5,["fly ash bricks","fire bricks"]],
  ["6907","HSN","Ceramic flags and paving/wall tiles",18,["ceramic tiles","floor tiles","wall tiles","vitrified tiles"]],
  ["7009","HSN","Glass mirrors",18,["mirrors","rear-view mirrors"]],
  ["7010","HSN","Carboys, bottles, jars of glass",18,["glass bottles","glass jars"]],
  ["7113","HSN","Articles of jewellery and parts — gold, silver",3,["gold jewellery","silver jewellery","diamond jewellery"]],
  ["7117","HSN","Imitation jewellery",3,["artificial jewellery","fashion jewellery","imitation jewellery"]],

  // ── CHAPTER 72–83: Metals ─────────────────────────────────────────────────
  ["7207","HSN","Semi-finished products of iron or non-alloy steel",18,["steel billets","steel blooms","steel ingots"]],
  ["7208","HSN","Flat-rolled products of iron, width ≥600mm",18,["HR coil","hot rolled steel","CR coil"]],
  ["7213","HSN","Bars and rods, hot-rolled, in irregularly wound coils",18,["TMT bars","steel wire rod","steel bars"]],
  ["7214","HSN","Other bars and rods of iron or non-alloy steel",18,["MS bars","angle bars","channel bars","I-beams"]],
  ["7227","HSN","Bars and rods of alloy steel",18,["stainless steel bars","alloy steel bars"]],
  ["7308","HSN","Structures and parts of iron or steel",18,["steel structures","iron fabrication","prefab structures"]],
  ["7312","HSN","Stranded wire, ropes, cables of iron/steel",18,["wire ropes","steel cables","binding wire"]],
  ["7315","HSN","Chain and parts thereof, of iron or steel",18,["steel chains","link chains","anchor chains"]],
  ["7317","HSN","Nails, tacks, drawing pins of iron or steel",18,["nails","screws","bolts","rivets"]],
  ["7318","HSN","Screws, bolts, nuts, washers of iron or steel",18,["screws","bolts","nuts","washers"]],

  // ── CHAPTER 84–85: Machinery & Electronics ───────────────────────────────
  ["8414","HSN","Air or vacuum pumps, air compressors, fans",18,["air compressor","ceiling fan","table fan","exhaust fan"]],
  ["8415","HSN","Air conditioning machines",28,["air conditioner","AC","split AC","window AC"]],
  ["8418","HSN","Refrigerators, freezers",18,["refrigerator","fridge","deep freezer"]],
  ["8421","HSN","Centrifuges, filtering or purifying machinery",18,["water purifier","RO system","washing machine"]],
  ["8422","HSN","Dishwashing machines",28,["dishwasher"]],
  ["8423","HSN","Weighing machinery",18,["weighing scales","industrial scales","platform scales"]],
  ["8428","HSN","Lifting and handling machinery — elevators, escalators",18,["elevator","lift","escalator","crane"]],
  ["8443","HSN","Printing machinery",18,["printers","printing machines","photocopiers"]],
  ["8450","HSN","Household washing machines",28,["washing machine","front-load washer","top-load washer"]],
  ["8452","HSN","Sewing machines",12,["sewing machine","industrial sewing machine"]],
  ["8471","HSN","Computers, laptops, automatic data processing machines",18,["laptop","desktop computer","tablet","server"]],
  ["8473","HSN","Parts and accessories for computers",18,["keyboard","mouse","hard disk","RAM","motherboard"]],
  ["8481","HSN","Taps, cocks, valves for pipes",18,["water valves","gate valves","ball valves","tap fittings"]],
  ["8501","HSN","Electric motors and generators",18,["electric motor","generator","alternator","dynamo"]],
  ["8502","HSN","Electric generating sets (generators)",18,["DG set","generator set","genset"]],
  ["8504","HSN","Electrical transformers, static converters (UPS)",18,["UPS","inverter","transformer","voltage stabilizer"]],
  ["8507","HSN","Electric accumulators (batteries)",28,["battery","lead acid battery","lithium battery","inverter battery"]],
  ["8516","HSN","Electric water heaters, geysers, hair dryers, irons",18,["geyser","water heater","electric iron","hair dryer","microwave oven"]],
  ["8517","HSN","Telephones, smartphones, base stations",18,["mobile phone","smartphone","landline phone","router","modem"]],
  ["8518","HSN","Microphones, loudspeakers, headphones",18,["speakers","headphones","earphones","microphones","home theatre"]],
  ["8519","HSN","Sound recording or reproducing apparatus",18,["MP3 player","CD player","turntable"]],
  ["8521","HSN","Video recording/reproducing apparatus",18,["DVD player","Blu-ray player","set top box"]],
  ["8525","HSN","Transmission apparatus for radio-broadcasting, CCTV, cameras",18,["CCTV camera","security camera","walkie-talkie","broadcasting equipment"]],
  ["8528","HSN","Monitors, projectors, televisions",28,["television","LED TV","monitor","projector"]],
  ["8534","HSN","Printed circuits (PCBs)",18,["PCB","printed circuit board"]],
  ["8536","HSN","Electrical apparatus for switching — switches, fuses",18,["electrical switches","MCB","fuses","circuit breakers","sockets"]],
  ["8544","HSN","Insulated wire, cable, optical fibre cable",18,["electrical wire","copper cable","optical fibre","electric cable"]],

  // ── CHAPTER 87: Vehicles ───────────────────────────────────────────────────
  ["8701","HSN","Tractors",12,["farm tractor","agricultural tractor"]],
  ["8702","HSN","Motor vehicles for transport of ≥10 persons (buses)",28,["bus","mini bus","school bus"],"+ cess on some"],
  ["8703","HSN","Motor cars and passenger vehicles",28,["car","sedan","SUV","hatchback","MPV"],"+ cess based on engine size"],
  ["8704","HSN","Motor vehicles for goods transport (trucks)",28,["truck","lorry","goods vehicle","tipper"]],
  ["8711","HSN","Motorcycles, mopeds, cycles with auxiliary motor",28,["motorcycle","bike","scooter","moped"],"+ cess"],
  ["8712","HSN","Bicycles and other cycles",12,["bicycle","cycle"]],
  ["8714","HSN","Parts and accessories for vehicles",28,["car parts","bike parts","accessories"]],
  ["8716","HSN","Trailers and semi-trailers",28,["trailer","semi-trailer","caravan"]],

  // ── CHAPTER 90: Medical & Optical ─────────────────────────────────────────
  ["9001","HSN","Optical fibres, lenses, contact lenses",12,["contact lenses","spectacle lenses","optical fibres"]],
  ["9002","HSN","Lenses, prisms, mirrors for instruments",12,["camera lenses","microscope lenses","binoculars"]],
  ["9018","HSN","Medical, surgical, dental instruments",12,["surgical instruments","stethoscope","thermometer","BP machine","glucometer"]],
  ["9019","HSN","Mechano-therapy appliances, massage apparatus",12,["physiotherapy equipment","massage machine"]],
  ["9021","HSN","Orthopaedic appliances — crutches, splints, hearing aids",5,["hearing aid","crutches","orthopaedic implants","artificial limbs"]],
  ["9022","HSN","Apparatus based on X-rays, CT scan, MRI",12,["X-ray machine","CT scanner","MRI machine","ultrasound machine"]],

  // ── CHAPTER 94–96: Furniture, Toys ────────────────────────────────────────
  ["9401","HSN","Seats — chairs, sofas, car seats",18,["sofa","chair","car seat","office chair","recliner"]],
  ["9403","HSN","Other furniture — beds, tables, cabinets",18,["bed","wardrobe","table","cabinet","bookshelf","TV unit"]],
  ["9404","HSN","Mattress supports, mattresses, sleeping bags",18,["mattress","foam mattress","spring mattress","pillows","quilt"]],
  ["9405","HSN","Lamps and lighting fittings",18,["LED bulb","tube light","lamp","chandelier","street light"]],
  ["9503","HSN","Tricycles, scooters, pedal cars, toys, scale models",18,["toys","toy cars","action figures","puzzles","board games"]],
  ["9504","HSN","Video game consoles, equipment for games",18,["video games","PlayStation","Xbox","gaming console"]],
  ["9506","HSN","Articles for sport, gymnastics, athletics",18,["cricket bat","football","sports equipment","gym equipment"]],
  ["9507","HSN","Fishing rods, fishhooks, fish lines",12,["fishing rod","fishhooks","fishing line"]],
  ["9601","HSN","Worked ivory, bone, shell — small wares",18,["ivory articles","bone articles"]],
  ["9603","HSN","Brooms, brushes, mops",18,["brooms","brushes","mops","toothbrushes"]],
  ["9619","HSN","Sanitary towels, baby diapers, feminine hygiene products",12,["sanitary pads","diapers","tampons","feminine hygiene"]],

  // ── CHAPTER 99: SAC (Service Codes) ───────────────────────────────────────
  ["9954","SAC","Construction services — civil, building",18,["construction","building","civil works","contracting","road construction"],"For affordable housing: 1%; other residential: 5%"],
  ["9963","SAC","Accommodation, food and beverage services",18,["hotel","restaurant","catering","food delivery","canteen"],"Hotel <Rs.1000/night: 12%; Restaurant: 5%/18%"],
  ["9964","SAC","Passenger transport services",5,["bus transport","air travel","train","taxi","auto-rickshaw","cab"]],
  ["9965","SAC","Goods transport services",18,["courier","freight","cargo","logistics","transport of goods"],"GTA: 5% reverse charge"],
  ["9966","SAC","Services auxiliary to transport",18,["freight forwarding","warehousing","packing services","cargo handling"]],
  ["9967","SAC","Supporting services in transport",18,["travel agency","tour operator","travel agent"]],
  ["9968","SAC","Postal and courier services",18,["courier services","express delivery","speed post"],"India Post basic services: exempt"],
  ["9971","SAC","Financial and related services",18,["banking services","insurance","stockbroking","financial advisory","processing fees"],"Pure life insurance: 18%"],
  ["9972","SAC","Real estate services",18,["real estate agent","property agent","brokerage"],"Sale of under-construction property: 5%"],
  ["9973","SAC","Leasing or rental services",18,["vehicle leasing","equipment rental","property leasing"]],
  ["9982","SAC","Legal and accounting services",18,["legal services","CA services","audit","legal advice","accounting"]],
  ["9983","SAC","Other professional, technical and business services",18,["consulting","IT consulting","management consulting","market research"]],
  ["9984","SAC","Telecommunications, broadcasting services",18,["mobile recharge","internet","broadband","DTH","cable TV","telecom"]],
  ["9985","SAC","Support services — security, cleaning, staffing",18,["security services","housekeeping","facility management","staffing"]],
  ["9987","SAC","Maintenance, repair and installation services",18,["repair services","AC service","vehicle repair","appliance repair"]],
  ["9988","SAC","Manufacturing services on goods owned by others (job work)",12,["job work","processing","printing on fabric","food processing"],"Textiles job work: 5%"],
  ["9993","SAC","Human health and social care services",0,["hospital","medical services","doctor consultation","diagnostic services","pathology lab"],"Clinical establishments: exempt"],
  ["9996","SAC","Recreational, cultural and sporting services",18,["movie tickets","amusement park","gym","fitness centre","OTT subscription"],"Movie tickets <Rs.100: 12%"],
  ["9997","SAC","Other services",18,["miscellaneous services","business support"]],
  ["9998","SAC","Domestic services",0,["domestic workers","maid services"]],
];

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const OUT_DIR = path.join(process.cwd(), "data", "hsn");
fs.mkdirSync(OUT_DIR, { recursive: true });

const records: HSNRecord[] = RAW_RECORDS.map(([code, type, description, gstRate, examples, notes]) => {
  const chapter = code.slice(0, 2);
  return {
    code,
    type,
    description,
    gstRate,
    chapter,
    chapterName: CHAPTERS[chapter] || "Other",
    examples,
    ...(notes ? { notes } : {}),
  };
});

// Sort by code
records.sort((a, b) => a.code.localeCompare(b.code));

// Index: code → record
const index: Record<string, HSNRecord> = {};
for (const r of records) index[r.code] = r;

// Per-chapter groups
const byChapter: Record<string, HSNRecord[]> = {};
for (const r of records) {
  if (!byChapter[r.chapter]) byChapter[r.chapter] = [];
  byChapter[r.chapter].push(r);
}

// Chapter list
const chapterList = Object.entries(CHAPTERS).map(([code, name]) => ({
  code,
  name,
  count: (byChapter[code] || []).length,
}));

fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
fs.writeFileSync(path.join(OUT_DIR, "chapters.json"), JSON.stringify(CHAPTERS));
fs.writeFileSync(path.join(OUT_DIR, "chapter-list.json"), JSON.stringify(chapterList, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "all.json"), JSON.stringify(records));

console.log(`✅ Generated ${records.length} HSN/SAC records across ${Object.keys(byChapter).length} chapters`);
console.log(`📁 Output: ${OUT_DIR}`);

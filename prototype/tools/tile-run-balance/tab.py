import json,sys,re
lab=sys.argv[1]; d=json.load(open('results/%s.json'%lab))
src=open('/home/user/tile_card_game_1/prototype/samples/tile-run.html').read()
us=re.findall(r"\{ id: '(\w+)',\s*name: '\w+',\s*c: '(\w)', rar: (\d)",src)
S=lambda x: min(100,round(100*x/20))
tot={0:[],1:[],2:[]}; fx={0:[],1:[],2:[]}
print('unit      L1 tiles          L5 tiles(score)      mean L5  fx(L5 score)')
for uid,c,r in sorted(us,key=lambda x:(x[2],x[1])):
    u=d['units'].get(uid)
    if not u: continue
    l1=[S(x) for x in u['1']['tiles']]; l5=[S(x) for x in u['5']['tiles']]; f=S(u['5']['fx'])
    m=sum(l5)/3; tot[int(r)].append(m); fx[int(r)].append(f)
    print(uid.ljust(9),r,str(l1).ljust(16),str(l5).ljust(18),'%5.0f'%m,'  fx',f)
for r in (0,1,2): print('rarity',r,'mean L5 tile',round(sum(tot[r])/len(tot[r])),'mean fx',round(sum(fx[r])/len(fx[r])))

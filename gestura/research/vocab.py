# Everyday vocabulary for Gestura's sign recogniser: English label -> ASL Citizen gloss names (variants merged).
WORDS = """hello bye thank_you please sorry welcome nice meet name my your you me we they he friend yes no ok fine good bad morning
afternoon night how what where when who why which understand know learn sign sign_language deaf hearing interpreter again slow fast
help need want like love have can will finish wait stop go come stay sit stand walk drive eat drink water hungry thirsty tired sick
hurt pain doctor nurse hospital medicine fire call phone home house school work bathroom toilet money pay buy cost time today tomorrow
yesterday now later week day year month family mother father sister brother baby child children boy girl man woman people person
teacher student happy sad angry mad excited scared feel think remember true right wrong left straight turn north south east west near
far here there up down inside outside behind front corner street road car bus train airplane bicycle city find see show tell ask
answer more all many big small hot cold new old clean dirty open close read write book computer play music color red blue green
yellow black white one two three four six seven eight nine hundred hour minute noon breakfast lunch dinner coffee tea milk apple
bread pizza cook kitchen bed sleep shower clothes shirt shoes hat rain snow sun weather warm cool wind tree flower dog cat bird fish
animal paper pen pencil table chair door window room office meeting boss practice try use make get give take bring send keep start
end not none nothing something everything always never sometimes often maybe same different other next last first must should
birthday party celebrate holiday vacation travel visit live die age young grow tall long fat thin strong weak easy hard important
funny serious quiet loud lost safe danger careful accident bleed fall break fix enjoy fun game basketball football soccer swim run
dance sing watch movie tv email internet text letter story library church america english language country world government
president vote law""".split()
ALIAS = {'police': ['policeman'], 'store': ['shop'], 'look': ['look at'], 'worry': ['worry'], 'pretty': ['pretty'],
         'excuse me': ['excuse'], 'sports': ['sports'], 'wake up': ['awake']}
VOCAB = {w.replace('_', ' '): [w.replace('_', ' ')] for w in WORDS}
VOCAB.update(ALIAS)

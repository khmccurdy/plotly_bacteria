import pandas as pd

from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import (
    Flask,
    render_template,
    jsonify)


engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")

Base = automap_base()
Base.prepare(engine, reflect=True)

Otu = Base.classes.otu
Samples = Base.classes.samples
Meta = Base.classes.samples_metadata

session = Session(engine)


app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/names")
def names():
    results = session.query(Meta.SAMPLEID).all()
    indList, = zip(*results)
    nameList = list(map(lambda x: f"BB_{x}", indList))
    return jsonify(nameList)

@app.route("/otu")
def otu():
    results = session.query(Otu.lowest_taxonomic_unit_found).all()
    descList, = zip(*results)
    return jsonify(descList)

@app.route("/metadata/<sample>")
def metadata(sample):
    sampleID = int(sample[3:])
    results = session.query(Meta.AGE, Meta.BBTYPE, Meta.ETHNICITY, Meta.GENDER, Meta.LOCATION).\
            filter(Meta.SAMPLEID==sampleID).first()
    
    metaDict = {"AGE"  : results[0], 
            "BBTYPE"   : results[1], 
            "ETHNICITY": results[2], 
            "GENDER"   : results[3], 
            "LOCATION" : results[4],
            "SAMPLEID" : sample}
    #return metaDict
    return jsonify(metaDict)

@app.route('/wfreq/<sample>')
def wfreq(sample):
    sampleID = int(sample[3:])
    results = session.query(Meta.WFREQ).filter(Meta.SAMPLEID==sampleID).first()
    return jsonify(results[0])

@app.route('/samples/<sample>')
def samples(sample):
    sel = eval(f"Samples.{sample}")
    results = session.query(Samples.otu_id, sel).order_by(sel.desc()).all()

    otu_ids, sample_values = zip(*results)
    sampleDict = {"otu_ids": list(otu_ids), "sample_values": list(sample_values)}

    return jsonify([sampleDict])

#print(samples("BB_940"))

if __name__ == "__main__":
    app.run(debug=True)
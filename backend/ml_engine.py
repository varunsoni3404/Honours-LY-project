import torch
from transformers import pipeline
import spacy
import networkx as nx

class FactGraphEngine:
    def __init__(self):
        print("Loading models... this may take a minute (RAM heavy!)")
        
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        self.fact_checker = pipeline("text-classification", model="roberta-large-mnli")
        self.nlp = spacy.load("en_core_web_sm")
        
        print("All models loaded successfully.")

    def generate_summary_and_graph(self, text):
        # 1. SUMMARIZATION
        summ_input_text = text[:3000] 
        
        summary_res = self.summarizer(
            summ_input_text, 
            max_new_tokens=400,   # Upper limit
            min_new_tokens=100,   # Lower limit 
            do_sample=False,      # Keep False for facts
            repetition_penalty=2.0, #Penalizes repeating the same sentence
            length_penalty=1.0,     #Encourage normal length
            early_stopping=True,     #Allow it to stop if it finishes early
            num_beams=4
        )
        summary_text = summary_res[0]['summary_text']

        nli_reference_text = text[:800] 

        sentences = [s.text for s in self.nlp(summary_text).sents]
        verified_sentences = []

        for sent in sentences:
            input_pair = f"{nli_reference_text} </s></s> {sent}"
            
            try:
                result = self.fact_checker(input_pair, truncation=True, max_length=512)
                score = result[0]['score']
                label = result[0]['label']
                
                status = "Verified"
                if label == "LABEL_0": 
                    status = "Hallucination Risk"
                elif label == "LABEL_1": 
                    status = "Unverified"
                
                verified_sentences.append({
                    "text": sent,
                    "status": status,
                    "confidence": round(score, 2)
                })
            except Exception as e:
                print(f"Skipping sentence due to length: {e}")
                verified_sentences.append({
                    "text": sent, 
                    "status": "Unverified", 
                    "confidence": 0.0
                })

        doc = self.nlp(text[:4000]) 
        nodes = []
        links = []
        seen_entities = set()

        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "GPE"] and ent.text not in seen_entities:
                nodes.append({"id": ent.text, "group": ent.label_})
                seen_entities.add(ent.text)
        
        for sent in doc.sents:
            sent_ents = [e.text for e in sent.ents if e.label_ in ["PERSON", "ORG", "GPE"]]
            if len(sent_ents) > 1:
                for i in range(len(sent_ents)-1):
                    links.append({
                        "source": sent_ents[i],
                        "target": sent_ents[i+1],
                        "value": 1
                    })

        return {
            "summary": verified_sentences,
            "graph_data": {"nodes": nodes, "links": links}
        }
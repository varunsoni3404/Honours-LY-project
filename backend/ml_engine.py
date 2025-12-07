import torch
from transformers import pipeline
import spacy
import networkx as nx

class FactGraphEngine:
    def __init__(self):
        print("Loading models... this may take a minute (RAM heavy!)")
        
        # 1. Summarization Pipeline (Using BART or PEGASUS)
        self.summarizer = pipeline("summarization", model="./my_final_summarizer")

        # 2. Hallucination/Fact Checker (NLI Model)
        # Returns: Entailment (True), Neutral, or Contradiction (Fake News)
        self.fact_checker = pipeline("text-classification", model="roberta-large-mnli")

        # 3. Entity Extraction for Graph
        self.nlp = spacy.load("en_core_web_sm")
        
        print("All models loaded successfully.")

    def generate_summary_and_graph(self, text):
        # A. SUMMARIZATION
        # Chunking text if too long (simplified for demo)
        max_chunk = 1024
        text_chunk = text[:max_chunk] 
        
        summary_res = self.summarizer(text_chunk, max_length=150, min_length=50, do_sample=False)
        summary_text = summary_res[0]['summary_text']

        # B. HALLUCINATION DETECTION (The "Complex" Part)
        # We split summary into sentences and check each against original text
        sentences = [s.text for s in self.nlp(summary_text).sents]
        verified_sentences = []

        for sent in sentences:
            # We create a pair: Original Text + Summary Sentence
            # The model checks if the Original Text 'entails' the Summary Sentence
            result = self.fact_checker(f"{text_chunk} </s></s> {sent}")
            # roberta-large-mnli labels: LABEL_0 (Contradiction), LABEL_1 (Neutral), LABEL_2 (Entailment)
            # We map them to simpler scores
            score = result[0]['score']
            label = result[0]['label']
            
            status = "Verified"
            if label == "LABEL_0": # Contradiction
                status = "Hallucination Risk"
            elif label == "LABEL_1": # Neutral
                status = "Unverified"
            
            verified_sentences.append({
                "text": sent,
                "status": status,
                "confidence": round(score, 2)
            })

        # C. KNOWLEDGE GRAPH GENERATION
        doc = self.nlp(text_chunk)
        nodes = []
        links = []
        seen_entities = set()

        # Extract entities (Nodes)
        for ent in doc.ents:
            if ent.text not in seen_entities:
                nodes.append({"id": ent.text, "group": ent.label_})
                seen_entities.add(ent.text)
        
        # Extract relationships (Links) - Simple heuristic: distinct entities in same sentence are linked
        for sent in doc.sents:
            sent_ents = [e.text for e in sent.ents]
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
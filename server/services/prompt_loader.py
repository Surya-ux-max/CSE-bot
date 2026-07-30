import os
from functools import lru_cache

PROMPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prompts"))

@lru_cache(maxsize=32)
def load_prompt_template(prompt_name: str) -> str:
    """
    Reads a markdown (.md) prompt file from server/prompts/ directory.
    Uses LRU cache so disk read happens only once per template file.
    """
    filename = f"{prompt_name}.md" if not prompt_name.endswith(".md") else prompt_name
    filepath = os.path.join(PROMPTS_DIR, filename)
    
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Prompt template file not found: {filepath}")
        
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def get_shared_nlp_rules() -> str:
    """Returns the content of shared_nlp_rules.md."""
    return load_prompt_template("shared_nlp_rules")

def render_prompt(prompt_name: str, **kwargs) -> str:
    """
    Loads prompt template and formats it with provided template arguments.
    Automatically passes shared_nlp_rules if referenced in template.
    """
    template = load_prompt_template(prompt_name)
    if "{shared_nlp_rules}" in template and "shared_nlp_rules" not in kwargs:
        kwargs["shared_nlp_rules"] = get_shared_nlp_rules()
    return template.format(**kwargs)

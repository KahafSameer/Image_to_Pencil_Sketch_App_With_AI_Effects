from diffusers import DiffusionPipeline
import torch
from PIL import Image

# Load FLUX.1-dev diffusion pipeline with Ghibli-style LoRA from Hugging Face
# Use CUDA if available for faster inference
pipe = DiffusionPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev", torch_dtype=torch.float16
).to("cuda" if torch.cuda.is_available() else "cpu")
pipe.load_lora_weights("strangerzonehf/Ghibli-Flux-Cartoon-LoRA")

# Function to generate Ghibli-style image from a text prompt
# Save the result to a given path using PIL
def generate_ghibli_image(prompt: str, output_path: str = "static/generated/ghibli_result.png"):
    full_prompt = "Ghibli Art – " + prompt
    result = pipe(full_prompt, num_inference_steps=30, guidance_scale=3.5, width=832, height=1280).images[0]
    result.save(output_path)
    return output_path
